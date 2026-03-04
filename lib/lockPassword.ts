import { createHash } from "node:crypto";

export function hashLockPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function isValidLockPassword(password: string): boolean {
  return password.trim().length >= 4;
}
