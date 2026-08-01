import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { createResume } from "@/lib/resume/service";
import { Builder } from "@/components/builder/builder";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumePage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  if (id === "new") {
    const resume = await createResume(user.id, {});
    redirect(`/resume/${resume.id}`);
  }

  const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
  if (!resume) redirect("/dashboard");

  return (
    <Builder
      resumeId={resume.id}
      initialTitle={resume.title}
      initialTemplate={resume.template}
      initialAccentColor={resume.accentColor}
      initialFont={resume.font}
      initialData={resume.data as never}
      initialTargetRole={resume.targetRole}
      initialTargetJobDescription={resume.targetJobDescription}
      initialScore={resume.aiScore}
    />
  );
}
