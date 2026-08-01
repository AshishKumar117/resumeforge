"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ScanSearch, XCircle } from "lucide-react";
import { scoreResumeApi, type AtsScoreResponse } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AtsDialogProps {
  data: unknown;
  resumeId: string;
  initialJd?: string | null;
  initialScore: number | null;
  onScore: (score: number, jd: string) => void;
}

export function AtsDialog({ data, resumeId, initialJd, initialScore, onScore }: AtsDialogProps) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState(initialJd ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsScoreResponse["score"] | null>(null);

  async function scan() {
    if (jd.trim().length < 20 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await scoreResumeApi(data, jd, resumeId);
      setResult(res.score);
      onScore(res.score.total, jd);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ScanSearch className="h-4 w-4" />
          {initialScore !== null ? `ATS ${initialScore}/100` : "ATS Score"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ATS compatibility score</DialogTitle>
          <DialogDescription>
            Paste the full job description. We&apos;ll score keyword match, formatting, and completeness against it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={6}
            placeholder="Paste the job description here (at least 20 characters)…"
          />
          <div className="flex items-center justify-between">
            {error && <p className="text-xs text-destructive">{error}</p>}
            <span className="flex-1" />
            <Button onClick={() => void scan()} disabled={busy || jd.trim().length < 20}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              Run scan
            </Button>
          </div>
        </div>

        {result && <ScoreCard result={result} />}
      </DialogContent>
    </Dialog>
  );
}

function ScoreCard({ result }: { result: AtsScoreResponse["score"] }) {
  const grade =
    result.total >= 80
      ? { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" }
      : result.total >= 60
        ? { label: "Needs work", color: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" }
        : { label: "Poor", color: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" };

  const subs = [
    { label: "Keyword match", value: result.keywordMatch },
    { label: "Formatting", value: result.formatting },
    { label: "Completeness", value: result.completeness },
  ];

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Overall score</p>
          <p className="text-3xl font-bold">{result.total}<span className="text-base font-normal text-muted-foreground">/100</span></p>
        </div>
        <span className={cn("text-sm font-semibold", grade.color)}>{grade.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", grade.bar)} style={{ width: `${result.total}%` }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {subs.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}%</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Matched ({result.matchedKeywords.length})
          </p>
          {result.matchedKeywords.length ? (
            <div className="flex flex-wrap gap-1">
              {result.matchedKeywords.map((k) => (
                <span key={k} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium">
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No keyword matches found.</p>
          )}
        </div>
        <div className="rounded-lg border bg-background p-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <XCircle className="h-3 w-3" /> Missing ({result.missingKeywords.length})
          </p>
          {result.missingKeywords.length ? (
            <div className="flex flex-wrap gap-1">
              {result.missingKeywords.map((k) => (
                <span key={k} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-medium">
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing missing.</p>
          )}
        </div>
      </div>

      {(result.formattingFlags.length > 0 || result.suggestions.length > 0) && (
        <div className="space-y-2">
          {result.formattingFlags.map((f) => (
            <p key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {f}
            </p>
          ))}
          {result.suggestions.map((s) => (
            <p key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
