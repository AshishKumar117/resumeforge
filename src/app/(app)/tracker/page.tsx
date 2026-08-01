import { requireUser } from "@/lib/auth/guards";
import prisma from "@/lib/db/client";
import { TrackerBoard } from "@/components/tracker/tracker-board";

export default async function TrackerPage() {
  const user = await requireUser();
  const apps = await prisma.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      company: true,
      role: true,
      location: true,
      url: true,
      status: true,
      notes: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Job tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track applications from applied to offer, all in one place.
        </p>
      </div>
      <TrackerBoard initial={apps.map((a) => ({ ...a, createdAt: new Date(a.createdAt) }))} />
    </div>
  );
}
