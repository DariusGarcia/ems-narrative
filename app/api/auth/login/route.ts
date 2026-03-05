import { NextResponse } from "next/server";
import {
  authCookieOptions,
  AUTH_COOKIE_NAME,
  createSessionToken,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  verifyPassword,
} from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const input = payload as { username?: unknown; password?: unknown };
  const username = typeof input.username === "string" ? normalizeUsername(input.username) : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!isValidUsername(username) || !isValidPassword(password)) {
    return jsonError("Invalid username or password.", 401);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .ilike("username", username)
      .maybeSingle();

    if (error || !user) {
      return jsonError("Invalid username or password.", 401);
    }

    if (!verifyPassword(password, user.password_hash)) {
      return jsonError("Invalid username or password.", 401);
    }

    const token = createSessionToken({
      id: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return response;
  } catch {
    return jsonError("Failed to sign in.", 500);
  }
}
