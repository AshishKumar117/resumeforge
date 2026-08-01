import { PLAN_LIMITS, PLANS, type Plan, type PlanLimits } from "@/lib/constants";

export interface GateUser {
  id: string;
  plan: string | null;
  emailVerified: boolean | null;
}

export function planOf(user: GateUser): Plan {
  return user.plan === PLANS.PRO ? PLANS.PRO : PLANS.FREE;
}

export function limitsFor(user: GateUser): PlanLimits {
  return PLAN_LIMITS[planOf(user)];
}

export class FeatureNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureNotAllowedError";
  }
}

/** Throw when a feature is not allowed for the user's plan. */
export function assertFeature(
  user: GateUser,
  check: (limits: PlanLimits) => boolean,
  featureName: string,
): void {
  if (!check(limitsFor(user))) {
    throw new FeatureNotAllowedError(
      `${featureName} is a Pro feature. Upgrade your plan to unlock it.`,
    );
  }
}

export function assertResumeCapacity(user: GateUser, currentCount: number): void {
  const max = limitsFor(user).maxResumes;
  if (currentCount >= max) {
    throw new FeatureNotAllowedError(
      `You've reached the ${max} resume limit on the Free plan. Delete one or upgrade to Pro for unlimited resumes.`,
    );
  }
}
