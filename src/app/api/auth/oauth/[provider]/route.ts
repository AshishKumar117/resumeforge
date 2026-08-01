import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthUrl, pkcePair, oauthConfigured, type OAuthProvider } from "@/lib/auth/oauth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "github") {
    return NextResponse.json({ error: "Invalid OAuth provider" }, { status: 400 });
  }

  if (!oauthConfigured(provider)) {
    return NextResponse.redirect(new URL("/login?oauth=unconfigured", process.env.APP_URL ?? "http://localhost:3000"));
  }

  const state = randomBytes(16).toString("base64url");
  const { verifier, challenge } = pkcePair();

  const store = await cookies();
  store.set("rf_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  store.set("rf_oauth_verifier", verifier, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });

  const url = buildAuthUrl(provider as OAuthProvider, state, challenge);
  return NextResponse.redirect(url);
}
