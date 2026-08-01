"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/constants";
import { SAMPLE_RESUME } from "@/lib/samples";
import { ResumePreview } from "@/components/preview/resume-preview";

export function TemplateGallery() {
  const [active, setActive] = useState(0);
  const template = TEMPLATES[active];
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 rounded-xl border px-4 py-3 text-left transition-colors lg:shrink",
              i === active
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-background hover:bg-accent",
            )}
          >
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.category === "PRO" ? "Pro" : "Free"}</p>
          </button>
        ))}
      </div>
      <div>
        <div className="rounded-2xl border bg-background/60 p-4 shadow-xl shadow-black/5">
          <div className="resume-sheet mx-auto max-w-[420px]">
            <ResumePreview
              data={SAMPLE_RESUME}
              template={template.id}
              accentColor={template.accentColors[0]}
              font={template.fonts[0]}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{template.description}</span>
          {template.atsSafe && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" /> ATS-safe
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
