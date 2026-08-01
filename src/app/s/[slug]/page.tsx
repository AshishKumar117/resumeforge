import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/db/client";
import { ResumePreview } from "@/components/preview/resume-preview";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const link = await prisma.shareLink.findUnique({ where: { slug }, include: { resume: true } });
  if (!link || !link.isActive) return { title: "Resume not found — ResumeForge" };
  return {
    title: `${link.resume.title} — ResumeForge`,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const link = await prisma.shareLink.findUnique({ where: { slug }, include: { resume: true } });
  if (!link || !link.isActive) notFound();

  const headerStore = await headers();
  const referrer = headerStore.get("referer") ?? undefined;

  await prisma.shareLink.update({
    where: { id: link.id },
    data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
  });
  await prisma.shareView.create({
    data: { shareLinkId: link.id, referrer: referrer?.slice(0, 500) ?? null },
  });

  const resume = link.resume;
  const data = resume.data as never;

  return (
    <div className="min-h-svh bg-muted/40 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">{resume.title}</p>
        </div>
        <div className="resume-sheet mx-auto max-w-full shadow-2xl shadow-black/10">
          <ResumePreview
            data={data}
            template={resume.template}
            accentColor={resume.accentColor}
            font={resume.font}
          />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Built with ResumeForge — the AI-powered ATS resume builder.
        </p>
      </div>
    </div>
  );
}
