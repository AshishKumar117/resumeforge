import prisma from "@/lib/db/client";
import { createEmptyResumeData, type ResumeData } from "@/lib/types/resume";
import { slugify, uid } from "@/lib/utils";

export interface ResumeMeta {
  id: string;
  userId: string;
  title: string;
  template: string;
  accentColor: string;
  font: string;
  status: string;
  aiScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const LIST_SELECT = {
  id: true,
  userId: true,
  title: true,
  template: true,
  accentColor: true,
  font: true,
  status: true,
  aiScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

function makeSlug(title: string): string {
  const base = slugify(title || "resume") || "resume";
  return `${base}-${uid("s").replace("s_", "").slice(0, 6)}`;
}

export async function listResumes(userId: string): Promise<Array<ResumeMeta & { data: ResumeData }>> {
  const rows = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { ...LIST_SELECT, data: true },
  });
  return rows.map((row) => ({ ...row, data: row.data as unknown as ResumeData }));
}

export async function getResume(userId: string, id: string) {
  const resume = await prisma.resume.findFirst({
    where: { id, userId },
    include: { shareLink: true },
  });
  return resume as (typeof resume & { data: ResumeData }) | null;
}

export async function createResume(
  userId: string,
  input: {
    title?: string;
    template?: string;
    accentColor?: string;
    font?: string;
    data?: ResumeData;
    slug?: string;
  },
) {
  const title = input.title?.trim() || "Untitled Resume";
  return prisma.resume.create({
    data: {
      userId,
      title,
      slug: input.slug ?? makeSlug(title),
      template: input.template ?? "modern",
      accentColor: input.accentColor ?? "#2563eb",
      font: input.font ?? "Inter",
      data: (input.data ?? createEmptyResumeData()) as object,
    },
  });
}

const SNAPSHOT_INTERVAL_MS = 60_000;
const MAX_VERSIONS = 25;

/**
 * Save resume content + settings. Writes the main row, then snapshots a
 * version at most once per minute (throttled) for the undo / history feature,
 * pruning the archive to MAX_VERSIONS.
 */
export async function saveResume(
  userId: string,
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
): Promise<void> {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) throw new Error("Resume not found");

  const latestVersion = await prisma.resumeVersion.findFirst({
    where: { resumeId: id },
    orderBy: { version: "desc" },
  });

  const shouldSnapshot =
    !latestVersion ||
    Date.now() - latestVersion.createdAt.getTime() > SNAPSHOT_INTERVAL_MS ||
    JSON.stringify(latestVersion.data) !== JSON.stringify(input.data);

  if (shouldSnapshot) {
    const nextVersion = (latestVersion?.version ?? 0) + 1;
    await prisma.$transaction([
      prisma.resumeVersion.create({
        data: { resumeId: id, version: nextVersion, data: input.data as object },
      }),
      prisma.resumeVersion.deleteMany({
        where: { resumeId: id, version: { lt: nextVersion - MAX_VERSIONS } },
      }),
    ]);
  }

  await prisma.resume.update({
    where: { id },
    data: {
      title: input.title,
      template: input.template,
      accentColor: input.accentColor,
      font: input.font,
      data: input.data as object,
      targetRole: input.targetRole ?? null,
      targetJobDescription: input.targetJobDescription ?? null,
      status: "COMPLETE",
    },
  });
}

export async function listVersions(userId: string, id: string) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return [];
  return prisma.resumeVersion.findMany({
    where: { resumeId: id },
    orderBy: { version: "desc" },
  });
}

export async function restoreVersion(userId: string, id: string, version: number): Promise<boolean> {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) return false;
  const snapshot = await prisma.resumeVersion.findUnique({
    where: { resumeId_version: { resumeId: id, version } },
  });
  if (!snapshot) return false;
  await prisma.resume.update({ where: { id }, data: { data: snapshot.data as object } });
  return true;
}

export async function deleteResume(userId: string, id: string): Promise<boolean> {
  const result = await prisma.resume.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function duplicateResume(userId: string, id: string): Promise<string | null> {
  const source = await getResume(userId, id);
  if (!source) return null;
  const copy = await createResume(userId, {
    title: `${source.title} (Copy)`,
    template: source.template,
    accentColor: source.accentColor,
    font: source.font,
    data: source.data as ResumeData,
  });
  return copy.id;
}
