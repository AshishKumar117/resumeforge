import { NextResponse } from "next/server";
import { apiError, requireApiUser, gateAiCall } from "@/lib/api/helpers";
import { ai } from "@/lib/ai";
import { AI_FEATURES } from "@/lib/constants";
import { coverLetterSchema } from "@/lib/validation/resume";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body");
  const parsed = coverLetterSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid input");

  const denied = await gateAiCall(user, AI_FEATURES.COVER_LETTER, ai.name);
  if (denied) return denied;

  try {
    const text = await ai.generateCoverLetter({
      data: parsed.data.data,
      jobDescription: parsed.data.jobDescription,
      company: parsed.data.company,
      tone: parsed.data.tone,
    });
    return NextResponse.json({ text });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Cover letter generation failed", 502);
  }
}
