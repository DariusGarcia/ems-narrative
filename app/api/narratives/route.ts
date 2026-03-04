import { NextResponse } from "next/server";
import {
  mapNarrativeRow,
  NARRATIVE_SELECT,
  type NarrativeRow,
} from "@/lib/narrativeData";
import { parseNarrativeWritePayload } from "@/lib/narrativePayload";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("narratives")
      .select(NARRATIVE_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      return jsonError("Failed to load narratives.", 500);
    }

    const narratives = ((data ?? []) as NarrativeRow[]).map(mapNarrativeRow);

    return NextResponse.json({ narratives });
  } catch {
    return jsonError(
      "Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      500,
    );
  }
}

export async function POST(request: Request) {
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

    const { data: insertedNarrative, error: insertError } = await supabase
      .from("narratives")
      .insert({
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .select("id")
      .single();

    if (insertError || !insertedNarrative) {
      return jsonError("Failed to create narrative.", 500);
    }

    if (parsed.data.tagIds.length > 0) {
      const narrativeTagRows = parsed.data.tagIds.map((tagId) => ({
        narrative_id: insertedNarrative.id,
        tag_id: tagId,
      }));

      const { error: narrativeTagError } = await supabase
        .from("narrative_tags")
        .insert(narrativeTagRows);

      if (narrativeTagError) {
        await supabase.from("narratives").delete().eq("id", insertedNarrative.id);
        return jsonError("Failed to assign tags to the narrative.", 500);
      }
    }

    const { data: savedNarrative, error: savedNarrativeError } = await supabase
      .from("narratives")
      .select(NARRATIVE_SELECT)
      .eq("id", insertedNarrative.id)
      .single();

    if (savedNarrativeError || !savedNarrative) {
      return jsonError("Narrative was created but could not be reloaded.", 500);
    }

    return NextResponse.json(
      { narrative: mapNarrativeRow(savedNarrative as NarrativeRow) },
      { status: 201 },
    );
  } catch {
    return jsonError("Failed to create narrative.", 500);
  }
}
