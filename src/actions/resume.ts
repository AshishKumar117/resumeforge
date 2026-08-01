"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { assertResumeCapacity } from "@/lib/billing/gating";
import * as service from "@/lib/resume/service";
import { createResumeSchema, saveResumeSchema } from "@/lib/validation/resume";
import type { ResumeData } from "@/lib/types/resume";

export async function createResumeAction(
  input: {
    title?: string;
    template?: string;
    accentColor?: string;
    font?: string;
  } = {},
) {
  const user = await requireUser();
  const parsed = createResumeSchema.safeParse(input);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join("; ");
    return { error: messages };
  }

  const existing = await service.listResumes(user.id);
  try {
    assertResumeCapacity(user, existing.length);
  } catch (e) {
    if (e instanceof Error) return { error: e.message };
  }

  const resume = await service.createResume(user.id, parsed.data);
  redirect(`/resume/${resume.id}`);
}

export async function createImportedResumeAction(partial: ResumeData) {
  const user = await requireUser();
  const existing = await service.listResumes(user.id);
  try {
    assertResumeCapacity(user, existing.length);
  } catch (e) {
    if (e instanceof Error) return { error: e.message };
  }

  const base = (await import("@/lib/types/resume")).createEmptyResumeData();
  const merged: ResumeData = {
    personal: { ...base.personal, ...(partial.personal ?? {}) },
    sections: partial.sections?.length ? partial.sections : base.sections,
  };
  const resume = await service.createResume(user.id, {
    title: `${merged.personal?.fullName || "Imported"} Resume`,
    data: merged,
  });
  redirect(`/resume/${resume.id}`);
}

export async function saveResumeAction(
  id: string,
  input: {
    title: string;
    template: string;
    accentColor: string;
    font: string;
    data: ResumeData;
    targetRole?: string | null;
    targetJobDescription?: string | null;
  },
) {
  const user = await requireUser();
  const parsed = saveResumeSchema.safeParse(input);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join("; ");
    return { error: messages };
  }
  try {
    await service.saveResume(user.id, id, {
      title: parsed.data.title,
      template: parsed.data.template,
      accentColor: parsed.data.accentColor,
      font: parsed.data.font,
      data: parsed.data.data,
      targetRole: parsed.data.targetRole ?? input.targetRole ?? null,
      targetJobDescription: parsed.data.targetJobDescription ?? input.targetJobDescription ?? null,
    });
    return { ok: true as const };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save resume" };
  }
}

export async function deleteResumeAction(id: string) {
  const user = await requireUser();
  await service.deleteResume(user.id, id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function duplicateResumeAction(id: string) {
  const user = await requireUser();
  const copyId = await service.duplicateResume(user.id, id);
  if (!copyId) return { error: "Resume not found" };
  revalidatePath("/dashboard");
  redirect(`/resume/${copyId}`);
}

export async function restoreVersionAction(id: string, version: number) {
  const user = await requireUser();
  const ok = await service.restoreVersion(user.id, id, version);
  if (!ok) return { error: "Version not found" };
  revalidatePath(`/resume/${id}`);
  return { ok: true as const };
}

export async function listVersionsAction(id: string) {
  const user = await requireUser();
  return service.listVersions(user.id, id);
}
