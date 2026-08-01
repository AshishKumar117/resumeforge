import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/client";
import { signSessionToken, verifySessionToken, SESSION_COOKIE_NAME, type SessionPayload } from "@/lib/auth/jwt";

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const SESSION_TTL = "30d";

export function sessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

function cookieOptions(maxAgeSeconds = TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Create a DB-backed session, sign the JWT, and set the cookie. */
export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: { userId, sessionToken: randomUUID(), expiresAt: new Date(Date.now() + TTL_SECONDS * 1000) },
  });

  const token = await signSessionToken(
    { sub: userId, sid: session.sessionToken },
    SESSION_TTL,
  );

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions());
  return token;
}

/** Destroy the current session (DB row + cookie). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      await prisma.session.deleteMany({ where: { sessionToken: payload.sid } }).catch(() => {});
    }
  }
  store.delete(SESSION_COOKIE_NAME);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  plan: string | null;
  targetRole: string | null;
  industry: string | null;
  experienceLevel: string | null;
  aiTone: string | null;
}

/** Resolve the authenticated user from the session cookie (server-side). */
export async function getSessionUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({ where: { sessionToken: payload.sid } });
  if (!session || session.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !!user.emailVerified,
    image: user.image,
    plan: user.plan,
    targetRole: user.targetRole,
    industry: user.industry,
    experienceLevel: user.experienceLevel,
    aiTone: user.aiTone,
  };
}

/** Verify a session token without a DB hit (used by proxy.ts for route gating). */
export async function hasValidToken(token: string): Promise<boolean> {
  const payload = await verifySessionToken(token);
  return payload !== null;
}

export type { SessionPayload };
