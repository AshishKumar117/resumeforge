import Link from "next/link";
import { ArrowRight, FilePlus2, FileText, ScanSearch, Sparkles, Upload } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { limitsFor } from "@/lib/billing/gating";
import { listResumes } from "@/lib/resume/service";
import { countDailyUsage } from "@/lib/ai/usage";
import { AI_FEATURES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeCard } from "@/components/dashboard/resume-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const limits = limitsFor(user);
  const [resumes, aiUsed, atsUsed] = await Promise.all([
    listResumes(user.id),
    countDailyUsage(user.id, AI_FEATURES.IMPROVE_BULLET),
    countDailyUsage(user.id, AI_FEATURES.ATS_ANALYZE),
  ]);

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {resumes.length === 0
            ? "Let's build a resume that gets interviews."
            : `You have ${resumes.length} resume${resumes.length === 1 ? "" : "s"}.`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {resumes.length}
              <span className="text-sm font-normal text-muted-foreground"> / {limits.maxResumes}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {limits.maxResumes === 999 ? "Unlimited on Pro" : `Free plan limit`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI credits used today</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {aiUsed}
              <span className="text-sm font-normal text-muted-foreground"> / {limits.aiCallsPerDay}</span>
            </p>
            <p className="text-xs text-muted-foreground">Bullet & summary rewrites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATS scans today</CardTitle>
            <ScanSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {atsUsed}
              <span className="text-sm font-normal text-muted-foreground"> / {limits.atsScansPerDay}</span>
            </p>
            <p className="text-xs text-muted-foreground">Job description matches</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your resumes</h2>
          <Button asChild size="sm">
            <Link href="/resume/new">
              <FilePlus2 />
              New resume
            </Link>
          </Button>
        </div>
        {resumes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FilePlus2 className="h-6 w-6" />
              </span>
              <div>
                <p className="font-medium">No resumes yet</p>
                <CardDescription className="mt-1">Create one now — it takes about ten minutes.</CardDescription>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href="/resume/new">
                    Start from a template
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/resume/import">
                    <Upload />
                    Import existing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
