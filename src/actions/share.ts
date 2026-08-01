"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { uid } from "@/lib/utils";

export async function getShareLinkAction(resumeId: string) {
  const user = await requireUser();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } });
  if (!resume) return null;
  return prisma.shareLink.findUnique({ where: { resumeId } });
}

export async function toggleShareLinkAction(resumeId: string, active: boolean) {
  const user = await requireUser();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } });
  if (!resume) return { error: "Resume not found" };

  const existing = await prisma.shareLink.findUnique({ where: { resumeId } });
  if (existing) {
    await prisma.shareLink.update({ where: { id: existing.id }, data: { isActive: active } });
  } else if (active) {
    await prisma.shareLink.create({ data: { resumeId, slug: uid("s").replace("s_", "") } });
  }
  revalidatePath(`/resume/${resumeId}`);
  return { ok: true as const };
}

export async function regenerateShareLinkAction(resumeId: string) {
  const user = await requireUser();
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } });
  if (!resume) return { error: "Resume not found" };

  const slug = uid("s").replace("s_", "");
  const existing = await prisma.shareLink.findUnique({ where: { resumeId } });
  if (existing) {
    await prisma.shareLink.update({ where: { id: existing.id }, data: { slug } });
  } else {
    await prisma.shareLink.create({ data: { resumeId, slug } });
  }
  revalidatePath(`/resume/${resumeId}`);
  return { ok: true as const, slug };
}
