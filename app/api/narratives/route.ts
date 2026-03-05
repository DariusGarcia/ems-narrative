import { NextResponse } from "next/server";
import {
  mapNarrativeRow,
  NARRATIVE_SELECT,
  type NarrativeRow,
} from "@/lib/narrativeData";
import { getSessionUserFromRequest } from "@/lib/auth";
import { hashLockPassword, isValidLockPassword } from "@/lib/lockPassword";
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

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUserFromRequest(request);
    const supabase = getSupabaseAdmin();
    const scope = new URL(request.url).searchParams.get("scope");

    let query = supabase
      .from("narratives")
      .select(NARRATIVE_SELECT)
      .order("updated_at", { ascending: false });

    if (scope === "mine") {
      if (!sessionUser) {
        return NextResponse.json({ narratives: [], user: null });
      }

      query = query.eq("owner_id", sessionUser.id);
    } else if (scope === "feed") {
      query = query.is("owner_id", null);
    } else if (sessionUser) {
      query = query.or(`owner_id.is.null,owner_id.eq.${sessionUser.id}`);
    } else {
      query = query.is("owner_id", null);
    }

    const { data, error } = await query;

    if (error) {
      return jsonError("Failed to load narratives.", 500);
    }

    const narratives = ((data ?? []) as NarrativeRow[]).map(mapNarrativeRow);
    const narrativeIds = narratives.map((narrative) => narrative.id);

    if (narrativeIds.length > 0) {
      const { data: favoriteRows, error: favoriteRowsError } = await supabase
        .from("narrative_favorites")
        .select("narrative_id")
        .in("narrative_id", narrativeIds);

      if (favoriteRowsError) {
        return jsonError("Failed to load favorite counts.", 500);
      }

      const favoriteCountByNarrativeId: Record<string, number> = {};
      for (const row of favoriteRows ?? []) {
        favoriteCountByNarrativeId[row.narrative_id] =
          (favoriteCountByNarrativeId[row.narrative_id] ?? 0) + 1;
      }

      for (const narrative of narratives) {
        narrative.favorite_count = favoriteCountByNarrativeId[narrative.id] ?? 0;
      }
    }

    if (sessionUser && narrativeIds.length > 0) {
      const { data: favorites, error: favoritesError } = await supabase
        .from("narrative_favorites")
        .select("narrative_id")
        .eq("user_id", sessionUser.id)
        .in("narrative_id", narrativeIds);

      if (favoritesError) {
        return jsonError("Failed to load favorite templates.", 500);
      }

      const favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.narrative_id));

      for (const narrative of narratives) {
        narrative.is_favorited = favoriteIds.has(narrative.id);
      }
    }

    return NextResponse.json({ narratives, user: sessionUser });
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

  const input = payload as { isLocked?: unknown; lockPassword?: unknown };
  const isLocked = input.isLocked === true;
  const lockPassword = typeof input.lockPassword === "string" ? input.lockPassword : "";
  const templateScope = input as { templateScope?: unknown };

  if (isLocked && !isValidLockPassword(lockPassword)) {
    return jsonError("Lock password must be at least 4 characters.", 400);
  }

  try {
    const sessionUser = await getSessionUserFromRequest(request);
    const createMine = templateScope.templateScope === "mine";

    if (createMine && !sessionUser) {
      return jsonError("You must be signed in to create personal templates.", 401);
    }

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
        is_locked: isLocked,
        lock_password_hash: isLocked ? hashLockPassword(lockPassword) : null,
        owner_id: createMine ? sessionUser?.id ?? null : null,
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
