import { NextResponse } from "next/server";
import {
  mapNarrativeRow,
  NARRATIVE_SELECT,
  type NarrativeRow,
} from "@/lib/narrativeData";
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

  try {
    const tagValidation = await validateTagIds(parsed.data.tagIds);

    if (!tagValidation.valid) {
      return jsonError(tagValidation.error, 400);
    }

    const supabase = getSupabaseAdmin();

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

export async function DELETE(_request: Request, context: RouteContext) {
  const narrativeId = await getNarrativeId(context);

  if (!narrativeId) {
    return jsonError("Narrative id is required.");
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: deletedNarrative, error } = await supabase
      .from("narratives")
      .delete()
      .eq("id", narrativeId)
      .select("id")
      .maybeSingle();

    if (error) {
      return jsonError("Failed to delete narrative.", 500);
    }

    if (!deletedNarrative) {
      return jsonError("Narrative not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to delete narrative.", 500);
  }
}
