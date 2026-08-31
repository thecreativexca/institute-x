import { createHash, randomBytes } from "crypto";

export const TOKEN_BYTES = 32;
export const TOKEN_HASH_ALGO = "sha256";

export function generateSecureToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashToken(token: string): string {
  return createHash(TOKEN_HASH_ALGO).update(token).digest("hex");
}

export function verifyToken(
  rawToken: string,
  storedHash: string
): boolean {
  const hash = hashToken(rawToken);
  return hash === storedHash;
}

export const TOKEN_EXPIRY = {
  VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
} as const;

export type TokenType = "verification" | "password_reset";

export function getTokenExpiry(type: TokenType): number {
  return type === "verification"
    ? TOKEN_EXPIRY.VERIFICATION
    : TOKEN_EXPIRY.PASSWORD_RESET;
}