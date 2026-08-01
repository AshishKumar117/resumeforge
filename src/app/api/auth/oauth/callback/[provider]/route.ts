import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  authenticateOAuth,
  exchangeCode,
  fetchProfile,
  oauthConfigured,
  type OAuthProvider,
} from "@/lib/auth/oauth";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "github") {
    return NextResponse.json({ error: "Invalid OAuth provider" }, { status: 400 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get("rf_oauth_state")?.value;
  const verifier = store.get("rf_oauth_verifier")?.value;
  store.delete("rf_oauth_state");
  store.delete("rf_oauth_verifier");

  if (oauthError || !code || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL("/login?oauth=error", BASE_URL));
  }

  try {
    if (!oauthConfigured(provider)) {
      return NextResponse.redirect(new URL("/login?oauth=unconfigured", BASE_URL));
    }
    const tokens = await exchangeCode(provider as OAuthProvider, code, verifier);
    const profile = await fetchProfile(provider as OAuthProvider, tokens.access_token);
    const user = await authenticateOAuth(provider as OAuthProvider, profile, tokens);

    return NextResponse.redirect(new URL(user.targetRole ? "/dashboard" : "/onboarding", BASE_URL));
  } catch {
    return NextResponse.redirect(new URL("/login?oauth=error", BASE_URL));
  }
}
