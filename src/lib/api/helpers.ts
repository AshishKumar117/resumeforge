import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth/guards";
import type { AuthUser } from "@/lib/auth/session";
import { limitsFor } from "@/lib/billing/gating";
import { assertWithinLimit, recordUsage } from "@/lib/ai/usage";
import { AI_FEATURES } from "@/lib/constants";

export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Get the API user, or a 401 response. */
export async function requireApiUser(): Promise<AuthUser | NextResponse> {
  const user = await apiUser();
  if (!user) return apiError("Authentication required", 401);
  return user;
}

/** Enforce the daily AI credit limit for a feature; records usage on success. */
export async function gateAiCall(
  user: AuthUser,
  feature: string,
  model: string,
): Promise<NextResponse | null> {
  const limits = limitsFor(user);
  const quota =
    feature === AI_FEATURES.ATS_ANALYZE ? limits.atsScansPerDay : limits.aiCallsPerDay;

  const gate = await assertWithinLimit(user.id, feature, quota);
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: `You've used all ${quota} ${feature === AI_FEATURES.ATS_ANALYZE ? "ATS scans" : "AI credits"} for today. Upgrade to Pro for a higher limit.`,
        used: gate.used,
        limit: gate.limit,
      },
      { status: 429 },
    );
  }
  await recordUsage(user.id, { feature, model });
  return null;
}
