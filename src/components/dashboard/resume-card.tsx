"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, FileText, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { deleteResumeAction, duplicateResumeAction } from "@/actions/resume";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getTemplateMeta } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResumeCardProps {
  resume: {
    id: string;
    title: string;
    template: string;
    accentColor: string;
    aiScore: number | null;
    status: string;
    updatedAt: Date;
    data: unknown;
  };
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const meta = getTemplateMeta(resume.template);
  const data = (resume.data ?? {}) as { personal?: { fullName?: string } };
  const fullName = data.personal?.fullName ?? "Untitled";

  async function duplicate() {
    if (busy) return;
    setBusy(true);
    const res = await duplicateResumeAction(resume.id);
    if (res?.error) {
      alert(res.error);
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm(`Delete "${resume.title}"? This cannot be undone.`)) return;
    setBusy(true);
    await deleteResumeAction(resume.id);
    router.refresh();
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-lg">
      <Link href={`/resume/${resume.id}`} className="block">
        <div className="relative flex h-44 items-center justify-center bg-muted/40 px-6 pt-6">
          <div className="h-full w-full max-w-[140px] rounded-sm border bg-white p-2 shadow-md" style={{ borderColor: resume.accentColor }}>
            <div className="h-2.5 w-3/4 rounded-sm" style={{ backgroundColor: resume.accentColor }} />
            <div className="mt-2 space-y-1">
              <div className="h-1 w-full rounded bg-gray-300/70" />
              <div className="h-1 w-5/6 rounded bg-gray-300/70" />
              <div className="mt-2 h-1 w-2/3 rounded bg-gray-300/50" />
              <div className="h-1 w-4/5 rounded bg-gray-300/50" />
              <div className="h-1 w-3/5 rounded bg-gray-300/50" />
            </div>
          </div>
        </div>
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{resume.title}</p>
            {resume.aiScore !== null && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  resume.aiScore >= 80
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : resume.aiScore >= 60
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400",
                )}
              >
                {resume.aiScore}/100
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{fullName}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {meta.name} · updated {formatDate(resume.updatedAt)}
          </p>
        </div>
      </Link>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/resume/${resume.id}`}>
                <FileText className="h-4 w-4" />
                Open editor
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void duplicate()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => void remove()}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
