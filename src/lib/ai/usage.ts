import prisma from "@/lib/db/client";

export interface AiUsageRecord {
  feature: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  cached?: boolean;
}

/** Count usage rows for a feature today. */
export async function countDailyUsage(userId: string, feature: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.aiUsage.count({
    where: { userId, feature, createdAt: { gte: startOfDay } },
  });
}

/** Check whether a user is within their daily limit for a feature. */
export async function assertWithinLimit(
  userId: string,
  feature: string,
  limit: number,
): Promise<{ ok: boolean; used: number; limit: number }> {
  const used = await countDailyUsage(userId, feature);
  const ok = used < limit;
  return { ok, used, limit };
}

/** Record a usage row. */
export async function recordUsage(userId: string, record: AiUsageRecord): Promise<void> {
  await prisma.aiUsage.create({
    data: {
      userId,
      feature: record.feature,
      model: record.model,
      promptTokens: record.promptTokens ?? 0,
      completionTokens: record.completionTokens ?? 0,
      cached: record.cached ?? false,
    },
  });
}
