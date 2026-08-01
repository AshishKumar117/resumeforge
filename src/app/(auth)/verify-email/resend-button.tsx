"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { resendVerificationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton() {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function onClick() {
    setState("loading");
    const result = await resendVerificationAction();
    setState(result?.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" /> Sent — check your inbox
      </span>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={state === "loading"}>
      {state === "loading" ? <Loader2 className="animate-spin" /> : null}
      Resend verification email
    </Button>
  );
}
