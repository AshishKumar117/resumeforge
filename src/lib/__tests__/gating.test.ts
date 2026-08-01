import { describe, expect, it } from "vitest";
import { limitsFor, planOf, assertResumeCapacity, FeatureNotAllowedError } from "@/lib/billing/gating";
import { PLANS, PLAN_LIMITS } from "@/lib/constants";

const freeUser = { id: "u1", plan: PLANS.FREE, emailVerified: true };
const proUser = { id: "u2", plan: PLANS.PRO, emailVerified: true };

describe("plan gating", () => {
  it("maps plan strings to plans", () => {
    expect(planOf(freeUser)).toBe(PLANS.FREE);
    expect(planOf(proUser)).toBe(PLANS.PRO);
    expect(planOf({ ...freeUser, plan: "BOGUS" })).toBe(PLANS.FREE);
  });

  it("exposes per-plan limits", () => {
    expect(limitsFor(freeUser)).toEqual(PLAN_LIMITS.FREE);
    expect(limitsFor(proUser)).toEqual(PLAN_LIMITS.PRO);
    expect(limitsFor(freeUser).allowExports).toEqual(["pdf"]);
    expect(limitsFor(proUser).allowExports).toContain("docx");
  });

  it("enforces resume capacity", () => {
    expect(() => assertResumeCapacity(freeUser, 3)).toThrow(FeatureNotAllowedError);
    expect(() => assertResumeCapacity(freeUser, 2)).not.toThrow();
    expect(() => assertResumeCapacity(proUser, 998)).not.toThrow();
  });
});
