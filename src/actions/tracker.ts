"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { z } from "zod";
import { JOB_STATUSES } from "@/lib/constants";

const STATUSES = JOB_STATUSES.map((s) => s.value);

const createSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  location: z.string().trim().max(120).optional().nullable(),
  url: z.string().trim().max(500).optional().nullable(),
  resumeId: z.string().optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

const updateSchema = z.object({
  status: z.enum(STATUSES as [string, ...string[]]),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export async function createApplicationAction(input: {
  company: string;
  role: string;
  location?: string | null;
  url?: string | null;
  resumeId?: string | null;
  notes?: string | null;
}) {
  const user = await requireUser();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const app = await prisma.jobApplication.create({
    data: {
      userId: user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location ?? null,
      url: parsed.data.url ?? null,
      resumeId: parsed.data.resumeId ?? null,
      notes: parsed.data.notes ?? null,
      status: "APPLIED",
    },
  });
  revalidatePath("/tracker");
  return { ok: true as const, id: app.id };
}

export async function updateApplicationAction(id: string, input: { status: string; notes?: string | null }) {
  const user = await requireUser();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const updated = await prisma.jobApplication.updateMany({
    where: { id, userId: user.id },
    data: { status: parsed.data.status, notes: parsed.data.notes ?? null },
  });
  if (updated.count === 0) return { error: "Application not found" };
  revalidatePath("/tracker");
  return { ok: true as const };
}

export async function deleteApplicationAction(id: string) {
  const user = await requireUser();
  await prisma.jobApplication.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/tracker");
  return { ok: true as const };
}
