"use client";

import { useState } from "react";
import { Briefcase, Loader2, Plus, Trash2 } from "lucide-react";
import { createApplicationAction, deleteApplicationAction, updateApplicationAction } from "@/actions/tracker";
import { JOB_STATUSES } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AppRow {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
}

export function TrackerBoard({ initial }: { initial: AppRow[] }) {
  const [apps, setApps] = useState(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [notesFor, setNotesFor] = useState<AppRow | null>(null);

  const total = apps.length;
  const interviews = apps.filter((a) => a.status === "INTERVIEW").length;
  const offers = apps.filter((a) => a.status === "OFFER").length;
  const responseRate = total ? Math.round(((interviews + offers) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Stat label="Applied" value={total} />
          <Stat label="Interviews" value={interviews} />
          <Stat label="Offers" value={offers} />
          <Stat label="Response rate" value={`${responseRate}%`} />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add application
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {JOB_STATUSES.map((status) => (
          <Column
            key={status.value}
            status={status}
            apps={apps.filter((a) => a.status === status.value)}
            onMove={(id, next) => {
              void updateApplicationAction(id, { status: next });
              setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
            }}
            onNotes={setNotesFor}
            onDelete={(id) => {
              void deleteApplicationAction(id);
              setApps((prev) => prev.filter((a) => a.id !== id));
            }}
          />
        ))}
      </div>

      {addOpen && (
        <AddDialog
          onClose={() => setAddOpen(false)}
          onAdd={(app) => {
            setApps((prev) => [app, ...prev]);
            setAddOpen(false);
          }}
        />
      )}
      {notesFor && (
        <NotesDialog app={notesFor} onClose={() => setNotesFor(null)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Column({
  status,
  apps,
  onMove,
  onNotes,
  onDelete,
}: {
  status: (typeof JOB_STATUSES)[number];
  apps: AppRow[];
  onMove: (id: string, next: string) => void;
  onNotes: (app: AppRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-2">
      <div className="flex items-center justify-between px-1.5 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={cn("h-2 w-2 rounded-full", status.color)} />
          {status.label}
        </span>
        <span className="text-xs text-muted-foreground">{apps.length}</span>
      </div>
      <div className="space-y-2">
        {apps.map((a) => (
          <div key={a.id} className="rounded-lg border bg-background p-3 shadow-sm">
            <p className="text-sm font-semibold">{a.role}</p>
            <p className="text-xs text-muted-foreground">{a.company}{a.location ? ` · ${a.location}` : ""}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</p>
            <div className="mt-2 flex items-center gap-1">
              <Select value={a.status} onValueChange={(v) => onMove(a.id, v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onNotes(a)} title="Notes">
                <Briefcase className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm(`Remove ${a.company} application?`)) onDelete(a.id);
                }}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {apps.length === 0 && (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Empty</p>
        )}
      </div>
    </div>
  );
}

function AddDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (app: AppRow) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!company.trim() || !role.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await createApplicationAction({
      company,
      role,
      location: location || null,
      url: url || null,
    });
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    onAdd({ id: res.id!, company, role, location: location || null, url: url || null, status: "APPLIED", notes: null, createdAt: new Date() });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>Track an application you&apos;ve submitted.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Job URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={() => void submit()} disabled={busy || !company.trim() || !role.trim()} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotesDialog({ app, onClose }: { app: AppRow; onClose: () => void }) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    await updateApplicationAction(app.id, { status: app.status, notes });
    setBusy(false);
    setSaved(true);
    setTimeout(onClose, 500);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {app.role} @ {app.company}
          </DialogTitle>
          <DialogDescription>{app.url ? `Link: ${app.url}` : "Add notes about this application."}</DialogDescription>
        </DialogHeader>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} placeholder="Contacts, interview dates, follow-ups…" />
        <Button onClick={() => void save()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? "Saved" : "Save notes"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
