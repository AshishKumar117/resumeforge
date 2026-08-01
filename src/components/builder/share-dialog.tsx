"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Eye, Loader2, Share2 } from "lucide-react";
import { getShareLinkAction, toggleShareLinkAction } from "@/actions/share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShareDialog({ resumeId }: { resumeId: string }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getShareLinkAction(resumeId).then((link) => {
      if (cancelled || !link) return;
      setSlug(link.slug);
      setActive(link.isActive);
      setViews(link.viewCount);
    });
    return () => {
      cancelled = true;
    };
  }, [open, resumeId]);

  async function toggle() {
    setLoading(true);
    const res = await toggleShareLinkAction(resumeId, !active);
    if (res?.error) {
      alert(res.error);
    } else {
      setActive(!active);
      if (!slug) {
        const link = await getShareLinkAction(resumeId);
        if (link) setSlug(link.slug);
      }
    }
    setLoading(false);
  }

  async function copy() {
    const url = `${window.location.origin}/s/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share this resume</DialogTitle>
          <DialogDescription>
            Share a read-only public link. It&apos;s never indexed by search engines.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{active ? "Link is live" : "Link is off"}</p>
              <p className="text-xs text-muted-foreground">
                {active ? `${views} view${views === 1 ? "" : "s"} · ${new Date().toLocaleDateString()}` : "Toggle to enable sharing"}
              </p>
            </div>
            <Switch checked={active} onCheckedChange={() => void toggle()} disabled={loading} />
          </div>

          {active && slug && (
            <div className="flex gap-2">
              <Input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${slug}`} className="flex-1 text-xs" />
              <Button variant="outline" size="icon" onClick={() => void copy()} title="Copy link">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {active && slug && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {views} total views tracked
            </p>
          )}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
