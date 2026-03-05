import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth";
import { hashLockPassword } from "@/lib/lockPassword";
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

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const input = payload as { password?: unknown };
  const password = typeof input.password === "string" ? input.password.trim() : "";

  try {
    const supabase = getSupabaseAdmin();
    const sessionUser = await getSessionUserFromRequest(request);
    const { data: narrative, error } = await supabase
      .from("narratives")
      .select("id, is_locked, lock_password_hash, owner_id")
      .eq("id", narrativeId)
      .maybeSingle();

    if (error) {
      return jsonError("Failed to unlock template.", 500);
    }

    if (!narrative) {
      return jsonError("Template not found.", 404);
    }

    if (narrative.owner_id && narrative.owner_id !== sessionUser?.id) {
      return jsonError("You do not have permission to access this template.", 403);
    }

    if (!narrative.is_locked) {
      return NextResponse.json({ success: true });
    }

    if (narrative.lock_password_hash !== hashLockPassword(password)) {
      return jsonError("Incorrect password for locked template.", 403);
    }

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to unlock template.", 500);
  }
}
