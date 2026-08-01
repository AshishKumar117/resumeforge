import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/db/client";

export type TokenType = "VERIFY_EMAIL" | "RESET_PASSWORD";

/** Hash a raw token before storing (defense-in-depth, DB leak safe). */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Issue a single-use token bound to an email. Returns the RAW token (to email)
 * while only the hash is stored in the DB.
 */
export async function createToken(email: string, type: TokenType, ttlMs = 24 * 60 * 60 * 1000): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token: hashToken(raw),
      type,
      expiresAt: new Date(Date.now() + ttlMs),
    },
  });
  return raw;
}

/**
 * Validate a raw token. On success, the token row is consumed (deleted).
 * Returns the identifier (email) it was issued for, or null if invalid/expired.
 */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!raw) return null;
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(raw), type },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }
  await prisma.verificationToken.delete({ where: { id: record.id } }).catch(() => {});
  return record.identifier;
}

/** Delete all pending tokens for an email + type (e.g. re-request). */
export async function revokeTokens(email: string, type: TokenType): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: email.toLowerCase(), type } });
}
