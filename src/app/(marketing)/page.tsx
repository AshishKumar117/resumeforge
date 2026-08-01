import Link from "next/link";
import { ArrowRight, BarChart3, FileDown, FileSearch, FileText, FolderKanban, MousePointerClick, Rocket, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { TemplateGallery } from "@/components/marketing/template-gallery";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";

const STATS = [
  { value: "92", label: "Avg. ATS score of Pro users" },
  { value: "40%", label: "More interviews after optimizing" },
  { value: "10min", label: "From blank page to ATS-ready" },
  { value: "100%", label: "Data stays on your account" },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "ATS scoring engine",
    description: "Paste any job description and get a keyword-by-keyword match score with a plain-language list of what to fix.",
  },
  {
    icon: Wand2,
    title: "AI bullet rewriting",
    description: "Turn 'responsible for X' into quantified, action-first bullets with one click — always based on what you wrote.",
  },
  {
    icon: MousePointerClick,
    title: "Live WYSIWYG preview",
    description: "Edit on the left, see your resume rendered pixel-for-pixel on the right across four ATS-safe templates.",
  },
  {
    icon: FileDown,
    title: "ATS-ready exports",
    description: "Download clean, machine-readable PDF, DOCX, or plain-text files — no tables, no graphics, no parsing failures.",
  },
  {
    icon: FolderKanban,
    title: "Built-in job tracker",
    description: "Track applications, interviews, and offers alongside the resumes you sent — pipeline stats at a glance.",
  },
  {
    icon: BarChart3,
    title: "Share links & analytics",
    description: "Share a public link to your resume and see who opened it, where they are, and how many times it was viewed.",
  },
];

const STEPS = [
  {
    icon: Rocket,
    step: "01",
    title: "Start smart",
    description: "Pick a template, start blank, or import your existing PDF or DOCX — content is structured for you automatically.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Match the job",
    description: "Paste the job description. ResumeForge scores you and shows exactly which keywords to work in.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Export & apply",
    description: "Polish with AI rewrites, then export an ATS-safe PDF in one click and track the application.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I sent the same resume to 30 places and heard nothing. After running it through ResumeForge against one job description, I rewrote two bullets and got an interview the next week.",
    name: "Priya N.",
    role: "Product Manager",
  },
  {
    quote:
      "The keyword matching is the killer feature. It told me the role used 'Docker' and I had written 'containers'. One word change, entire score jumped.",
    name: "Marcus T.",
    role: "Backend Engineer",
  },
  {
    quote:
      "I've built resumes in Word, Canva, and LaTeX. This is the first tool that outputs a PDF my company's ATS actually parses perfectly every time.",
    name: "Sofia L.",
    role: "Data Analyst",
  },
];

export const metadata = {
  title: "ResumeForge — AI-Powered ATS Resume Builder",
  description:
    "Score your resume against real job descriptions, rewrite bullets with AI, and export ATS-safe PDFs in minutes.",
  openGraph: {
    title: "ResumeForge — AI-Powered ATS Resume Builder",
    description:
      "Score your resume against real job descriptions, rewrite bullets with AI, and export ATS-safe PDFs in minutes.",
  },
};

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_50%_-10%,var(--color-primary)_0%,transparent_55%)] opacity-20" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="info" className="mx-auto">
              <Sparkles className="mr-1 h-3 w-3" />
              Now with AI bullet rewriting
            </Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Pass the ATS.{" "}
              <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                Get the interview.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              ResumeForge scores your resume against the exact job description, rewrites your bullets with AI, and
              exports ATS-safe PDFs — so recruiters actually see the real you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Build my resume free
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free forever plan. No credit card required.</p>
          </div>

          <div className="mt-16">
            <HeroDemo />
          </div>

          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="order-2 mt-1 block text-sm text-muted-foreground">{s.label}</dt>
                <dd className="order-1 text-3xl font-bold text-primary">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how-it-works" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From blank page to ATS-ready in minutes</h2>
            <p className="mt-3 text-muted-foreground">
              A focused workflow that removes the guesswork from every step.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-2xl border bg-background/70 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-muted-foreground/40">{s.step}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to land interviews</h2>
          <p className="mt-3 text-muted-foreground">
            Built by engineers who were tired of getting filtered out by bots.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-background/70 p-6 transition-colors hover:border-primary/30">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="templates" className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">ATS-safe templates that still look human</h2>
            <p className="mt-3 text-muted-foreground">
              Every template is verified to parse cleanly in real applicant tracking systems.
            </p>
          </div>
          <div className="mt-12">
            <TemplateGallery />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start free. Upgrade when you&apos;re serious.</h2>
          <p className="mt-3 text-muted-foreground">
            No credit card required. Your resumes are always yours.
          </p>
        </div>
        <div className="mt-12">
          <Pricing />
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by job seekers</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border bg-background/70 p-6">
                <blockquote className="text-sm leading-relaxed text-muted-foreground">“{t.quote}”</blockquote>
                <figcaption className="mt-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mt-12">
          <Faq />
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your next interview starts with one resume.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of candidates who stopped guessing and started matching.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Get started free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/templates">Browse templates</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
