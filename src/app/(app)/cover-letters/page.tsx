import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { CoverLettersManager } from "@/components/cover-letters/cover-letters-manager";

export default async function CoverLettersPage() {
  const user = await requireUser();
  const [letters, resumes] = await Promise.all([
    prisma.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, content: true, targetCompany: true, targetRole: true, updatedAt: true },
    }),
    prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, data: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cover letters</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a tailored cover letter from a resume and a job description, then save and reuse it.
        </p>
      </div>
      <CoverLettersManager
        initial={letters.map((l) => ({ ...l, updatedAt: new Date(l.updatedAt) }))}
        resumes={resumes.map((r) => ({ id: r.id, title: r.title, data: r.data as unknown }))}
      />
    </div>
  );
}
