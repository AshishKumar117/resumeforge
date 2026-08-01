"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { onboardingAction } from "@/actions/auth";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "PROFESSIONAL", label: "Professional", description: "Polished and standard" },
  { value: "CONCISE", label: "Concise", description: "Tight, punchy, data-first" },
  { value: "CONFIDENT", label: "Confident", description: "Assertive, results-driven" },
  { value: "FRIENDLY", label: "Friendly", description: "Approachable and warm" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [aiTone, setAiTone] = useState("PROFESSIONAL");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await onboardingAction({
      targetRole,
      industry,
      experienceLevel: experienceLevel || undefined,
      aiTone,
    });
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Let&apos;s tailor your experience
        </CardTitle>
        <CardDescription>
          Tell us about your goals and we&apos;ll personalize your starter template and AI tone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="targetRole">Target role</Label>
            <Input
              id="targetRole"
              placeholder="e.g. Senior Frontend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Used to tailor AI summaries and ATS scoring.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. SaaS, Fintech, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Experience level</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setExperienceLevel(level.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    experienceLevel === level.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>AI writing tone</Label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setAiTone(tone.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    aiTone === tone.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <p className="text-sm font-medium">{tone.label}</p>
                  <p className="text-xs text-muted-foreground">{tone.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
              disabled={pending}
            >
              Skip for now
            </Button>
            <Button type="submit" className="flex-1" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Get started
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
