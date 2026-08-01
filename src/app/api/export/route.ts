import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { apiError, requireApiUser } from "@/lib/api/helpers";
import { limitsFor } from "@/lib/billing/gating";
import { exportResume, type ExportFormat } from "@/lib/export";
import { resumeDataSchema } from "@/lib/validation/resume";

const FORMATS: ExportFormat[] = ["pdf", "docx", "txt"];

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body");

  const format = body.format;
  if (!FORMATS.includes(format)) return apiError("Unsupported export format");

  const limits = limitsFor(user);
  if (!limits.allowExports.includes(format)) {
    return apiError(`${format.toUpperCase()} export is a Pro feature. Upgrade to unlock it.`, 403);
  }

  let data: unknown;
  let settings: { accentColor?: string; font?: string } = {};
  let title = "Resume";

  if (typeof body.resumeId === "string" && body.resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: body.resumeId, userId: user.id } });
    if (!resume) return apiError("Resume not found", 404);
    data = resume.data;
    settings = { accentColor: resume.accentColor ?? undefined, font: resume.font ?? undefined };
    title = resume.title;
  } else {
    const parsed = resumeDataSchema.safeParse(body.data);
    if (!parsed.success) return apiError("Invalid resume data");
    data = parsed.data;
    settings = {
      accentColor: typeof body.accentColor === "string" ? body.accentColor : undefined,
      font: typeof body.font === "string" ? body.font : undefined,
    };
    title = typeof body.title === "string" && body.title ? body.title : "Resume";
  }

  try {
    const result = await exportResume(data as never, settings, format, title);
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Export failed", 500);
  }
}
