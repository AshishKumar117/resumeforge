"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { z } from "zod";

const saveSchema = z.object({
  title: z.string().trim().min(1).max(120),
  resumeId: z.string().optional().nullable(),
  content: z.string().trim().min(1).max(100_000),
  targetCompany: z.string().trim().max(200).optional().nullable(),
  targetRole: z.string().trim().max(200).optional().nullable(),
});

export async function createCoverLetterAction(input: {
  title: string;
  resumeId?: string | null;
  content?: string;
  targetCompany?: string | null;
  targetRole?: string | null;
}) {
  const user = await requireUser();
  const parsed = saveSchema.safeParse({ ...input, content: input.content ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const cover = await prisma.coverLetter.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      resumeId: parsed.data.resumeId ?? null,
      content: parsed.data.content,
      targetCompany: parsed.data.targetCompany ?? null,
      targetRole: parsed.data.targetRole ?? null,
    },
  });
  revalidatePath("/cover-letters");
  return { ok: true as const, id: cover.id };
}

export async function saveCoverLetterAction(id: string, input: { title: string; content: string }) {
  const user = await requireUser();
  const parsed = saveSchema.safeParse({ ...input, title: input.title, content: input.content });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const updated = await prisma.coverLetter.updateMany({
    where: { id, userId: user.id },
    data: { title: parsed.data.title, content: parsed.data.content },
  });
  if (updated.count === 0) return { error: "Cover letter not found" };
  revalidatePath("/cover-letters");
  return { ok: true as const };
}

export async function deleteCoverLetterAction(id: string) {
  const user = await requireUser();
  await prisma.coverLetter.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/cover-letters");
  return { ok: true as const };
}
