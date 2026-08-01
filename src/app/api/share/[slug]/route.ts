import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await prisma.shareLink.findUnique({ where: { slug }, include: { resume: true } });
  if (!link || !link.isActive) {
    return NextResponse.json({ error: "Resume not found or sharing is disabled" }, { status: 404 });
  }
  return NextResponse.json({
    title: link.resume.title,
    template: link.resume.template,
    accentColor: link.resume.accentColor,
    font: link.resume.font,
    data: link.resume.data,
  });
}
