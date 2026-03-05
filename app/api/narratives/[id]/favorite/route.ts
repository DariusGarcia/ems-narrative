import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth";
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

export async function POST(request: Request, context: RouteContext) {
  const narrativeId = await getNarrativeId(context);

  if (!narrativeId) {
    return jsonError("Narrative id is required.");
  }

  try {
    const sessionUser = await getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("You must be signed in to favorite templates.", 401);
    }

    const supabase = getSupabaseAdmin();

    const { data: narrative, error: narrativeError } = await supabase
      .from("narratives")
      .select("id, owner_id")
      .eq("id", narrativeId)
      .maybeSingle();

    if (narrativeError) {
      return jsonError("Failed to update favorite.", 500);
    }

    if (!narrative) {
      return jsonError("Narrative not found.", 404);
    }

    if (narrative.owner_id && narrative.owner_id !== sessionUser.id) {
      return jsonError("You do not have permission to favorite this template.", 403);
    }

    const { error: favoriteError } = await supabase.from("narrative_favorites").upsert(
      {
        user_id: sessionUser.id,
        narrative_id: narrativeId,
      },
      { onConflict: "user_id,narrative_id", ignoreDuplicates: true },
    );

    if (favoriteError) {
      return jsonError("Failed to favorite this template.", 500);
    }

    return NextResponse.json({ success: true, favorited: true });
  } catch {
    return jsonError("Failed to favorite this template.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const narrativeId = await getNarrativeId(context);

  if (!narrativeId) {
    return jsonError("Narrative id is required.");
  }

  try {
    const sessionUser = await getSessionUserFromRequest(request);
    if (!sessionUser) {
      return jsonError("You must be signed in to update favorites.", 401);
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("narrative_favorites")
      .delete()
      .eq("user_id", sessionUser.id)
      .eq("narrative_id", narrativeId);

    if (error) {
      return jsonError("Failed to remove favorite.", 500);
    }

    return NextResponse.json({ success: true, favorited: false });
  } catch {
    return jsonError("Failed to remove favorite.", 500);
  }
}
