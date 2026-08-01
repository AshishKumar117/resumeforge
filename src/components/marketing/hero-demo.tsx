"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ResumePreview } from "@/components/preview/resume-preview";
import { SAMPLE_RESUME, SAMPLE_ATS_KEYWORDS } from "@/lib/samples";

const SCORE_SEGMENTS: Array<{ label: string; value: number; bars: number }> = [
  { label: "Keyword match", value: 92, bars: 4 },
  { label: "Formatting", value: 88, bars: 4 },
  { label: "Completeness", value: 95, bars: 4 },
];

export function HeroDemo() {
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [phase, setPhase] = useState<"match" | "score">("match");

  useEffect(() => {
    const t = setInterval(() => {
      setKeywordIndex((i) => {
        const next = i + 1;
        if (next >= SAMPLE_ATS_KEYWORDS.length) {
          setPhase("score");
          setTimeout(() => setPhase("match"), 2800);
          return 0;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(t);
  }, []);

  const keyword = SAMPLE_ATS_KEYWORDS[keywordIndex];
  const highlight = phase === "match" ? [keyword] : SAMPLE_ATS_KEYWORDS;

  return (
    <div className="pointer-events-none relative mx-auto w-full max-w-5xl select-none">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-tr from-primary/20 via-transparent to-primary/10 blur-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border bg-background/80 p-4 shadow-2xl shadow-black/10 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Live preview
            </span>
          </div>
          <div className="resume-sheet mx-auto">
            <ResumePreview
              data={SAMPLE_RESUME}
              template="modern"
              accentColor="#2563eb"
              font="Inter"
              highlight={highlight}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border bg-background/80 p-5 shadow-xl shadow-black/10 backdrop-blur">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ATS Score</p>
                <p className="mt-1 text-4xl font-bold text-primary">92</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Excellent
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {SCORE_SEGMENTS.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{s.label}</span>
                    <span className="font-medium text-foreground">{s.value}%</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < s.bars ? "bg-primary" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5 shadow-xl shadow-black/10 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Matching against
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Senior Frontend Engineer
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SAMPLE_ATS_KEYWORDS.map((kw, i) => (
                <span
                  key={kw}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    phase === "match" && i === keywordIndex
                      ? "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
