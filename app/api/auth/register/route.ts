import { NextResponse } from "next/server";
import {
  authCookieOptions,
  AUTH_COOKIE_NAME,
  createSessionToken,
  ensureAuthSessionSecretConfigured,
  hashPassword,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
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

  if (!isValidUsername(username)) {
    return jsonError(
      "Username must be 3-32 characters and use letters, numbers, dot, dash, or underscore.",
    );
  }

  if (!isValidPassword(password)) {
    return jsonError("Password must be at least 4 characters.");
  }

  try {
    ensureAuthSessionSecretConfigured();
    const supabase = getSupabaseAdmin();
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (existingError) {
      return jsonError("Failed to create account.", 500);
    }

    if (existingUser) {
      return jsonError("Username already exists.", 409);
    }

    const { data: createdUser, error: createError } = await supabase
      .from("users")
      .insert({
        username,
        password_hash: hashPassword(password),
      })
      .select("id, username")
      .single();

    if (createError || !createdUser) {
      return jsonError("Failed to create account.", 500);
    }

    const token = createSessionToken({
      id: createdUser.id,
      username: createdUser.username,
    });

    const response = NextResponse.json({
      user: {
        id: createdUser.id,
        username: createdUser.username,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return response;
  } catch {
    return jsonError("Failed to create account.", 500);
  }
}
