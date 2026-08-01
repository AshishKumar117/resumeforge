"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What is an ATS, and why does it matter?",
    a: "An Applicant Tracking System (ATS) is software recruiters use to filter resumes before a human ever reads them. If your resume isn't machine-readable and keyword-matched, you can be rejected even if you're a perfect fit. ResumeForge scores your resume against the exact job description so you fix problems before you apply.",
  },
  {
    q: "How accurate is the ATS score?",
    a: "The scoring engine parses your resume for keyword coverage, standard section headings, contact completeness, and formatting red flags (tables, graphics, missing dates). We show exactly which keywords matched and which are missing, plus plain-language fixes.",
  },
  {
    q: "Do I need to write my resume from scratch?",
    a: "No. Start from a blank template or import an existing PDF or DOCX — ResumeForge extracts the content and structures it into editable sections you can polish with one-click AI rewrites.",
  },
  {
    q: "Does the AI rewrite invent facts?",
    a: "Never. Every AI suggestion works from what you already wrote and stays truthful to it — rewriting bullet points to be stronger and more quantifiable without fabricating achievements.",
  },
  {
    q: "Can I keep my resumes private?",
    a: "Yes. Your data is stored on your account only. Shareable links are opt-in, revocable, and never indexed by search engines.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Upgrade, downgrade, or cancel from the billing page with one click. Your work is never held hostage — you can always export PDFs even on the free plan.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {FAQS.map((f, i) => (
        <div
          key={f.q}
          className={cn(
            "rounded-xl border bg-background/70 transition-colors",
            open === i && "border-primary/40 bg-primary/[0.03]",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium">{f.q}</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")}
            />
          </button>
          {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
