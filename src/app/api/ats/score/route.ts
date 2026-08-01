import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { apiError, requireApiUser, gateAiCall } from "@/lib/api/helpers";
import { ai } from "@/lib/ai";
import { AI_FEATURES } from "@/lib/constants";
import { jdSchema, resumeDataSchema } from "@/lib/validation/resume";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body");

  const jd = jdSchema.safeParse({ jobDescription: body.jobDescription });
  if (!jd.success) return apiError(jd.error.issues[0]?.message ?? "Invalid job description");
  const data = resumeDataSchema.safeParse(body.data);
  if (!data.success) return apiError("Invalid resume data");

  const denied = await gateAiCall(user, AI_FEATURES.ATS_ANALYZE, ai.name);
  if (denied) return denied;

  try {
    const analysis = await ai.analyzeAts(data.data, jd.data.jobDescription);

    if (typeof body.resumeId === "string" && body.resumeId) {
      await prisma.resume
        .updateMany({ where: { id: body.resumeId, userId: user.id }, data: { aiScore: analysis.total } })
        .catch(() => {});
    }

    return NextResponse.json({ score: { ...analysis, scannedAt: new Date().toISOString() } });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "ATS analysis failed", 502);
  }
}
