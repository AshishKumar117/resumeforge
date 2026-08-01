import { randomBytes, createHash } from "crypto";
import prisma from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";

export type OAuthProvider = "google" | "github";

interface ProviderConfig {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scopes: "openid email profile",
  },
  github: {
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scopes: "read:user user:email",
  },
};

function clientCredentials(provider: OAuthProvider): { id: string; secret: string } {
  const id = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const secret = provider === "google" ? process.env.GOOGLE_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(`OAuth provider "${provider}" is not configured. Set its CLIENT_ID/CLIENT_SECRET env vars.`);
  }
  return { id, secret };
}

export function oauthConfigured(provider: OAuthProvider): boolean {
  const creds = provider === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
  const secret = provider === "google" ? process.env.GOOGLE_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;
  return Boolean(creds && secret);
}

/** PKCE challenge generation (S256). */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Build the authorization URL for a provider. */
export function buildAuthUrl(provider: OAuthProvider, state: string, codeChallenge: string): string {
  const cfg = PROVIDERS[provider];
  const { id } = clientCredentials(provider);
  const redirectUri = `${process.env.APP_URL}/api/auth/oauth/callback/${provider}`;
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: cfg.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${cfg.authorizationUrl}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}

/** Exchange an authorization code for tokens. */
export async function exchangeCode(provider: OAuthProvider, code: string, codeVerifier: string): Promise<TokenResponse> {
  const cfg = PROVIDERS[provider];
  const { id, secret } = clientCredentials(provider);
  const redirectUri = `${process.env.APP_URL}/api/auth/oauth/callback/${provider}`;
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  return (await res.json()) as TokenResponse;
}

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

/** Fetch the user profile from the provider. */
export async function fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
  const cfg = PROVIDERS[provider];
  const res = await fetch(cfg.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  const json = await res.json();

  if (provider === "google") {
    return {
      id: json.sub,
      email: json.email,
      name: json.name ?? json.given_name ?? json.email.split("@")[0],
      image: json.picture ?? null,
    };
  }

  // GitHub: public email may be null — fall back to /user/emails.
  let email = json.email;
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? "";
    }
  }
  return {
    id: json.id.toString(),
    email,
    name: json.name ?? json.login,
    image: json.avatar_url ?? null,
  };
}

/**
 * Find-or-create a user from an OAuth profile, link the Account, and log them in.
 * Email-conflict policy: if the email already exists with a local password,
 * link the OAuth account to that user instead of erroring.
 */
export async function authenticateOAuth(provider: OAuthProvider, profile: OAuthProfile, tokens: TokenResponse) {
  const email = profile.email.toLowerCase();

  const existingAccount = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.id } },
    include: { user: true },
  });

  let user = existingAccount?.user;

  if (!user) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      user = existingUser;
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name || email.split("@")[0],
          email,
          emailVerified: new Date(),
          image: profile.image,
        },
      });
    }
    await prisma.account.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      },
    });
  }

  // Keep avatar in sync on subsequent logins.
  if (profile.image && user.image !== profile.image) {
    user = await prisma.user.update({ where: { id: user.id }, data: { image: profile.image } });
  }

  await createSession(user.id);
  return user;
}
