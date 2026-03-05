import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const AUTH_COOKIE_NAME = "ems_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  username: string;
};

type SessionPayload = {
  uid: string;
  usr: string;
  exp: number;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET environment variable.");
  }

  return secret;
}

export function normalizeUsername(username: string): string {
  return username.trim();
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(username.trim());
}

export function isValidPassword(password: string): boolean {
  return password.trim().length >= 4;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    uid: user.id,
    usr: user.username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const serializedPayload = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serializedPayload);
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  let payload: SessionPayload;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload.uid || !payload.usr || !payload.exp) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.uid,
    username: payload.usr,
  };
}

function readCookieFromHeader(cookieHeader: string, key: string): string | null {
  const segments = cookieHeader.split(";").map((segment) => segment.trim());

  for (const segment of segments) {
    if (!segment.startsWith(`${key}=`)) {
      continue;
    }

    return decodeURIComponent(segment.slice(key.length + 1));
  }

  return null;
}

export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = readCookieFromHeader(cookieHeader, AUTH_COOKIE_NAME);

  if (!token) {
    return null;
  }

  const sessionUser = verifySessionToken(token);
  if (!sessionUser) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", sessionUser.id)
    .maybeSingle();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
