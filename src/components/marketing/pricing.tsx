"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingFeature {
  label: string;
  included: boolean;
}

const FREE_FEATURES: PricingFeature[] = [
  { label: "3 resumes", included: true },
  { label: "4 ATS templates", included: true },
  { label: "AI bullet & summary rewriting", included: true },
  { label: "10 AI credits / day", included: true },
  { label: "3 ATS scans / day", included: true },
  { label: "PDF export", included: true },
  { label: "ATS-optimized DOCX / TXT export", included: false },
  { label: "Unlimited resumes & versions", included: false },
  { label: "200 AI credits / day", included: false },
  { label: "50 ATS scans / day", included: false },
  { label: "Advanced analytics", included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { label: "Unlimited resumes & versions", included: true },
  { label: "All 4 ATS templates + custom accents", included: true },
  { label: "AI bullet & summary rewriting", included: true },
  { label: "200 AI credits / day", included: true },
  { label: "50 ATS scans / day", included: true },
  { label: "PDF, DOCX, TXT & email export", included: true },
  { label: "Import existing resume (PDF/DOCX)", included: true },
  { label: "Job tracker", included: true },
  { label: "Shareable links & analytics", included: true },
  { label: "Priority support", included: true },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  const monthly = annual ? Math.round(12 * 0.8) : 12;
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <div className="relative rounded-2xl border bg-background/70 p-8 shadow-xl shadow-black/5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Free</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Starter</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Perfect for a first great resume.</p>
        <p className="mt-6 text-4xl font-bold">
          $0<span className="text-base font-normal text-muted-foreground">/mo</span>
        </p>
        <Button asChild variant="outline" size="lg" className="mt-6 w-full">
          <a href="/signup">Start for free</a>
        </Button>
        <ul className="mt-8 space-y-2.5">
          {FREE_FEATURES.map((f) => (
            <li key={f.label} className="flex items-start gap-2.5 text-sm">
              {f.included ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={cn(f.included ? "text-foreground" : "text-muted-foreground/70 line-through")}>
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/10 to-background p-8 shadow-2xl shadow-primary/10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Most popular
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Pro</h3>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            $79/mo value
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to land the interview.</p>
        <div className="mt-6 flex items-baseline gap-2">
          <p className="text-4xl font-bold">${monthly}</p>
          <span className="text-sm text-muted-foreground">/mo</span>
          {annual && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              20% off
            </span>
          )}
        </div>
        <label className="mt-4 flex items-center justify-center gap-3 text-sm">
          <span className={cn(!annual && "font-semibold text-foreground", "text-muted-foreground")}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((a) => !a)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              annual ? "bg-primary" : "bg-input",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
                annual ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
          <span className={cn(annual && "font-semibold text-foreground", "text-muted-foreground")}>Annual</span>
        </label>
        <Button asChild size="lg" className="mt-6 w-full">
          <a href="/signup?plan=pro">Get Pro</a>
        </Button>
        <ul className="mt-8 space-y-2.5">
          {PRO_FEATURES.map((f) => (
            <li key={f.label} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
