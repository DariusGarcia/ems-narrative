import { NextResponse } from "next/server";
import {
  mapNarrativeRow,
  NARRATIVE_SELECT,
  type NarrativeRow,
} from "@/lib/narrativeData";
import { getSessionUserFromRequest } from "@/lib/auth";
import { hashLockPassword } from "@/lib/lockPassword";
import { parseNarrativeWritePayload } from "@/lib/narrativePayload";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getNarrativeId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return typeof params.id === "string" ? params.id : "";
}

async function validateTagIds(tagIds: string[]) {
  if (tagIds.length === 0) {
    return { valid: true as const };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from("tags").select("id").in("id", tagIds);

  if (error) {
    return { valid: false as const, error: "Failed to validate tags." };
  }

  const existingIds = new Set((data ?? []).map((tag) => tag.id));
  const allTagsExist = tagIds.every((id) => existingIds.has(id));

  if (!allTagsExist) {
    return {
      valid: false as const,
      error: "One or more selected tags do not exist. Refresh and try again.",
    };
  }

  return { valid: true as const };
}

export async function PUT(request: Request, context: RouteContext) {
  const narrativeId = await getNarrativeId(context);

  if (!narrativeId) {
    return jsonError("Narrative id is required.");
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = parseNarrativeWritePayload(payload);

  if (!parsed.data) {
    return jsonError(parsed.error ?? "Invalid request body.");
  }

  const input = payload as { unlockPassword?: unknown };
  const unlockPassword =
    typeof input.unlockPassword === "string" ? input.unlockPassword.trim() : "";

  try {
    const tagValidation = await validateTagIds(parsed.data.tagIds);

    if (!tagValidation.valid) {
      return jsonError(tagValidation.error, 400);
    }

    const supabase = getSupabaseAdmin();
    const sessionUser = await getSessionUserFromRequest(request);

    const { data: existingNarrative, error: existingNarrativeError } = await supabase
      .from("narratives")
      .select("id, is_locked, lock_password_hash, owner_id")
      .eq("id", narrativeId)
      .maybeSingle();

    if (existingNarrativeError) {
      return jsonError("Failed to update narrative.", 500);
    }

    if (!existingNarrative) {
      return jsonError("Narrative not found.", 404);
    }

    if (existingNarrative.owner_id && existingNarrative.owner_id !== sessionUser?.id) {
      return jsonError("You do not have permission to edit this template.", 403);
    }

    if (
      existingNarrative.is_locked &&
      existingNarrative.lock_password_hash !== hashLockPassword(unlockPassword)
    ) {
      return jsonError("Incorrect password for locked template.", 403);
    }

    const { data: updatedNarrative, error: updateError } = await supabase
      .from("narratives")
      .update({
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .eq("id", narrativeId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return jsonError("Failed to update narrative.", 500);
    }

    if (!updatedNarrative) {
      return jsonError("Narrative not found.", 404);
    }

    const { error: deleteLinksError } = await supabase
      .from("narrative_tags")
      .delete()
      .eq("narrative_id", narrativeId);

    if (deleteLinksError) {
      return jsonError("Failed to update narrative tags.", 500);
    }

    if (parsed.data.tagIds.length > 0) {
      const narrativeTagRows = parsed.data.tagIds.map((tagId) => ({
        narrative_id: narrativeId,
        tag_id: tagId,
      }));

      const { error: insertLinksError } = await supabase
        .from("narrative_tags")
        .insert(narrativeTagRows);

      if (insertLinksError) {
        return jsonError("Failed to update narrative tags.", 500);
      }
    }

    const { data: savedNarrative, error: savedNarrativeError } = await supabase
      .from("narratives")
      .select(NARRATIVE_SELECT)
      .eq("id", narrativeId)
      .single();

    if (savedNarrativeError || !savedNarrative) {
      return jsonError("Narrative updated but failed to reload.", 500);
    }

    return NextResponse.json({ narrative: mapNarrativeRow(savedNarrative as NarrativeRow) });
  } catch {
    return jsonError("Failed to update narrative.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const narrativeId = await getNarrativeId(context);

  if (!narrativeId) {
    return jsonError("Narrative id is required.");
  }

  try {
    const supabase = getSupabaseAdmin();
    const sessionUser = await getSessionUserFromRequest(request);
    const requestBody = (await request.text()).trim();
    let payload: { unlockPassword?: unknown } = {};

    if (requestBody) {
      try {
        payload = JSON.parse(requestBody) as { unlockPassword?: unknown };
      } catch {
        return jsonError("Invalid JSON body.");
      }
    }

    const unlockPassword =
      typeof payload.unlockPassword === "string" ? payload.unlockPassword.trim() : "";

    const { data: existingNarrative, error: existingNarrativeError } = await supabase
      .from("narratives")
      .select("id, is_locked, lock_password_hash, owner_id")
      .eq("id", narrativeId)
      .maybeSingle();

    if (existingNarrativeError) {
      return jsonError("Failed to delete narrative.", 500);
    }

    if (!existingNarrative) {
      return jsonError("Narrative not found.", 404);
    }

    if (existingNarrative.owner_id && existingNarrative.owner_id !== sessionUser?.id) {
      return jsonError("You do not have permission to delete this template.", 403);
    }

    if (
      existingNarrative.is_locked &&
      existingNarrative.lock_password_hash !== hashLockPassword(unlockPassword)
    ) {
      return jsonError("Incorrect password for locked template.", 403);
    }

    const { error } = await supabase
      .from("narratives")
      .delete()
      .eq("id", narrativeId)
      .select("id");

    if (error) {
      return jsonError("Failed to delete narrative.", 500);
    }

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to delete narrative.", 500);
  }
}
