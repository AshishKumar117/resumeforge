import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "rf_session";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me");

export interface SessionPayload {
  sub: string; // user id
  sid: string; // session id
  email?: string;
  [key: string]: unknown;
}

export async function signSessionToken(payload: SessionPayload, ttl = "30d"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("resumeforge")
    .setAudience("resumeforge.app")
    .setExpirationTime(ttl)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "resumeforge",
      audience: "resumeforge.app",
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
