"use client";

import { useState } from "react";
import { FilePenLine, Loader2, Sparkles, Trash2 } from "lucide-react";
import { createCoverLetterAction, deleteCoverLetterAction, saveCoverLetterAction } from "@/actions/cover-letters";
import { generateCoverLetterApi } from "@/lib/ai/client";
import { formatDate } from "@/lib/utils";
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

interface CoverLetterRow {
  id: string;
  title: string;
  content: string;
  targetCompany: string | null;
  targetRole: string | null;
  updatedAt: Date;
}

export function CoverLettersManager({
  initial,
  resumes,
}: {
  initial: CoverLetterRow[];
  resumes: Array<{ id: string; title: string; data: unknown }>;
}) {
  const [letters, setLetters] = useState(initial);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{letters.length} saved cover letters</p>
        <Button onClick={() => setGenerateOpen(true)}>
          <Sparkles />
          Generate with AI
        </Button>
      </div>

      {letters.length === 0 && !generateOpen && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No cover letters yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate one from a resume and a job description, then save and reuse it.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {letters.map((l) => (
          <div key={l.id} className="rounded-xl border bg-background p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[l.targetCompany, l.targetRole].filter(Boolean).join(" · ") || "Saved draft"} ·{" "}
                  {formatDate(l.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditId(l.id)} title="Edit">
                  <FilePenLine className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this cover letter?")) {
                      void deleteCoverLetterAction(l.id);
                      setLetters((prev) => prev.filter((x) => x.id !== l.id));
                    }
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{l.content}</p>
          </div>
        ))}
      </div>

      {generateOpen && (
        <GenerateDialog
          resumes={resumes}
          onClose={() => setGenerateOpen(false)}
          onSaved={(letter) => {
            setLetters((prev) => [letter, ...prev]);
            setGenerateOpen(false);
          }}
        />
      )}
      {editId && (
        <EditDialog
          letter={letters.find((l) => l.id === editId)!}
          onClose={() => setEditId(null)}
          onSaved={(updated) => {
            setLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setEditId(null);
          }}
        />
      )}
    </div>
  );
}

function GenerateDialog({
  resumes,
  onClose,
  onSaved,
}: {
  resumes: Array<{ id: string; title: string; data: unknown }>;
  onClose: () => void;
  onSaved: (letter: CoverLetterRow) => void;
}) {
  const [resumeId, setResumeId] = useState<string>(resumes[0]?.id ?? "");
  const [company, setCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState("PROFESSIONAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  async function generate() {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume || jd.trim().length < 20 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const text = await generateCoverLetterApi({
        data: resume.data,
        jobDescription: jd,
        company: company || undefined,
        tone,
      });
      setDraft(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const title = company ? `Cover letter — ${company}` : targetRole ? `Cover letter — ${targetRole}` : "Cover letter";
    const res = await createCoverLetterAction({
      title,
      resumeId,
      content: draft ?? "",
      targetCompany: company || null,
      targetRole: targetRole || null,
    });
    if (res?.error) {
      setError(res.error);
      return;
    }
    onSaved({
      id: res.id!,
      title,
      content: draft ?? "",
      targetCompany: company || null,
      targetRole: targetRole || null,
      updatedAt: new Date(),
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate a cover letter</DialogTitle>
          <DialogDescription>
            Uses your resume details plus the job description. Review the draft before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Resume</Label>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Company (optional)</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target role (optional)</Label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Frontend Engineer" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Job description</Label>
            <Textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={5} placeholder="Paste the job description…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="CONFIDENT">Confident</SelectItem>
                <SelectItem value="CONCISE">Concise</SelectItem>
                <SelectItem value="FRIENDLY">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => void generate()} disabled={busy || jd.trim().length < 20}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate draft
          </Button>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {draft !== null && (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
              <Label className="text-xs">Draft</Label>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={14} className="font-serif" />
              <Button onClick={() => void save()} className="w-full">
                Save cover letter
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  letter,
  onClose,
  onSaved,
}: {
  letter: CoverLetterRow;
  onClose: () => void;
  onSaved: (letter: CoverLetterRow) => void;
}) {
  const [title, setTitle] = useState(letter.title);
  const [content, setContent] = useState(letter.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await saveCoverLetterAction(letter.id, { title, content });
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    onSaved({ ...letter, title, content, updatedAt: new Date() });
    setBusy(false);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit cover letter</DialogTitle>
          <DialogDescription>{formatDate(letter.updatedAt)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="font-serif" />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={() => void save()} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
