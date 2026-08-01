"use client";

import { useState } from "react";
import { Check, CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRO_FEATURES = [
  "Unlimited resumes & version history",
  "All 4 ATS-safe templates",
  "200 AI credits / day",
  "50 ATS scans / day",
  "PDF, DOCX, TXT & email export",
  "Import existing resumes (PDF/DOCX)",
  "Job tracker & share-link analytics",
];

export function BillingClient({
  plan,
  subscription,
}: {
  plan: string;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;
}) {
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPro = plan === "PRO";

  async function checkout() {
    setBusy("checkout");
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to start checkout");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(null);
    }
  }

  async function portal() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to open portal");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open portal");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-muted-foreground" /> Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isPro ? "success" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
              {subscription?.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Renews {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ""}
                </span>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Cancels {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ""}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPro
                ? "You're on the Pro plan — every feature unlocked."
                : "Free plan: 3 resumes, 10 AI credits/day, 3 ATS scans/day, PDF export."}
            </p>
          </div>
          {isPro ? (
            <Button variant="outline" onClick={() => void portal()} disabled={busy === "portal"}>
              {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Manage billing
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {!isPro && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Upgrade to Pro
            </CardTitle>
            <CardDescription>Unlimited resumes, AI credits, ATS scans, and every export format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border p-1">
                <button
                  type="button"
                  onClick={() => setInterval("month")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${interval === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("year")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${interval === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Annual · 20% off
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground">{interval === "year" ? "$115" : "$12"}</span>/
                {interval === "year" ? "year" : "month"}
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={() => void checkout()} disabled={busy === "checkout"}>
              {busy === "checkout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Upgrade to Pro
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Cancel anytime from this page. You&apos;ll keep access until the end of the billing period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
