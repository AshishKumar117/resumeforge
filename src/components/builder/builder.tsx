"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";
import { deleteResumeAction, listVersionsAction, restoreVersionAction, saveResumeAction } from "@/actions/resume";
import type { ResumeData, ResumeSection, ResumeItem, SectionType } from "@/lib/types/resume";
import { createSection } from "@/lib/types/resume";
import { uid } from "@/lib/utils";
import { getTemplateMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResumePreview } from "@/components/preview/resume-preview";
import { PersonalEditor } from "@/components/builder/personal-editor";
import { SectionEditor, AddSectionButton, type SectionHelpers } from "@/components/builder/section-editor";
import { SettingsMenu } from "@/components/builder/settings-menu";
import { ExportMenu } from "@/components/builder/export-menu";
import { AtsDialog } from "@/components/builder/ats-dialog";
import { ShareDialog } from "@/components/builder/share-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BuilderProps {
  resumeId: string;
  initialTitle: string;
  initialTemplate: string;
  initialAccentColor: string;
  initialFont: string;
  initialData: ResumeData;
  initialTargetRole: string | null;
  initialTargetJobDescription: string | null;
  initialScore: number | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function Builder({
  resumeId,
  initialTitle,
  initialTemplate,
  initialAccentColor,
  initialFont,
  initialData,
  initialTargetRole,
  initialTargetJobDescription,
  initialScore,
}: BuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [template, setTemplate] = useState(initialTemplate);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [font, setFont] = useState(initialFont);
  const [data, setData] = useState<ResumeData>(() => ({ ...initialData, sections: [...initialData.sections] }));
  const [targetRole] = useState(initialTargetRole ?? "");
  const [targetJobDescription, setTargetJobDescription] = useState(initialTargetJobDescription ?? "");
  const [score, setScore] = useState<number | null>(initialScore);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [preview, setPreview] = useState(true);
  const [scale, setScale] = useState(0.72);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const meta = getTemplateMeta(template);
  const lockedTemplates = meta.category === "PRO" ? [] : [];

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------
  const persist = useCallback(async () => {
    if (firstRender.current) return;
    setSaveState("saving");
    const res = await saveResumeAction(resumeId, {
      title,
      template,
      accentColor,
      font,
      data,
      targetRole: targetRole || null,
      targetJobDescription: targetJobDescription || null,
    });
    setSaveState(res?.ok ? "saved" : "error");
  }, [resumeId, title, template, accentColor, font, data, targetRole, targetJobDescription]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      setSaveState("saved");
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => void persist(), 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, template, accentColor, font, data, targetRole, targetJobDescription, persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      void persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Data mutations
  // -------------------------------------------------------------------------
  const updateSection = useCallback((id: string, patch: Partial<ResumeSection>) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const addItem = useCallback((sectionId: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, items: [...s.items, { id: uid("itm") }] };
      }),
    }));
  }, []);

  const updateItem = useCallback((sectionId: string, itemId: string, patch: Partial<ResumeItem>) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : s,
      ),
    }));
  }, []);

  const removeItem = useCallback((sectionId: string, itemId: string) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((it) => it.id !== itemId) } : s,
      ),
    }));
  }, []);

  const moveItem = useCallback((sectionId: string, itemId: string, dir: -1 | 1) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const index = s.items.findIndex((it) => it.id === itemId);
        const target = index + dir;
        if (index < 0 || target < 0 || target >= s.items.length) return s;
        const items = [...s.items];
        [items[index], items[target]] = [items[target], items[index]];
        return { ...s, items };
      }),
    }));
  }, []);

  const addSection = useCallback((type: SectionType) => {
    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, createSection(type)],
    }));
  }, []);

  const removeSection = useCallback((id: string) => {
    setData((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  }, []);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setData((prev) => {
      const index = prev.sections.findIndex((s) => s.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  }, []);

  const helpers: SectionHelpers = {
    updateSection,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    removeSection,
    moveSection,
  };

  const allowedExports =
    meta.category === "PRO" ? ["pdf", "docx", "txt", "email"] : ["pdf"];

  async function handleScore(total: number, jd: string) {
    setScore(total);
    setTargetJobDescription(jd);
  }

  async function handleDelete() {
    if (!confirm("Delete this resume permanently?")) return;
    await deleteResumeAction(resumeId);
    router.push("/dashboard");
  }

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col lg:h-svh">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
        <Button asChild variant="ghost" size="icon" title="Back to dashboard">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 max-w-[180px] font-semibold sm:max-w-[260px]"
          aria-label="Resume title"
        />
        <SaveIndicator state={saveState} />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <AtsDialog
            data={data}
            resumeId={resumeId}
            initialJd={targetJobDescription}
            initialScore={score}
            onScore={(t, jd) => void handleScore(t, jd)}
          />
          <SettingsMenu
            settings={{ template, accentColor, font }}
            onChange={(patch) => {
              if (patch.template) setTemplate(patch.template);
              if (patch.accentColor) setAccentColor(patch.accentColor);
              if (patch.font) setFont(patch.font);
            }}
            lockedTemplates={lockedTemplates}
          />
          <ShareDialog resumeId={resumeId} />
          <ExportMenu
            resumeId={resumeId}
            title={title}
            data={data}
            accentColor={accentColor}
            font={font}
            allowedFormats={allowedExports}
          />
          <VersionsMenu resumeId={resumeId} />
          <Button variant="ghost" size="icon" onClick={() => void handleDelete()} title="Delete resume">
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Editor */}
        <div
          className={cn(
            "min-w-0 flex-1 overflow-y-auto border-r p-4",
            !preview && "mx-auto w-full max-w-2xl border-r-0",
          )}
        >
          <div className={cn("space-y-5", preview ? "lg:mx-auto lg:max-w-2xl" : "mx-auto max-w-2xl")}>
            <PersonalEditor
              personal={data.personal}
              onChange={(patch) => setData((prev) => ({ ...prev, personal: { ...prev.personal, ...patch } }))}
            />
            {data.sections.map((section) => (
              <SectionEditor key={section.id} section={section} helpers={helpers} targetRole={targetRole} />
            ))}
            <AddSectionButton onAdd={addSection} />
            <p className="pb-4 text-center text-xs text-muted-foreground">
              Tip: run an ATS scan before exporting — it catches the problems recruiters&apos; bots will.
            </p>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="hidden min-w-0 flex-1 flex-col bg-muted/40 lg:flex">
            <div className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">Live preview</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.08))}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  –
                </button>
                <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(1, s + 0.08))}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div
                className="mx-auto w-[794px] origin-top transition-transform"
                style={{ transform: `scale(${scale})`, height: 1123 * scale }}
              >
                <div className="resume-sheet">
                  <ResumePreview
                    data={data}
                    template={template}
                    accentColor={accentColor}
                    font={font}
                    scale={1}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile preview toggle */}
      {preview && (
        <button
          type="button"
          onClick={() => setPreview(false)}
          className="fixed bottom-4 right-4 z-20 hidden rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-lg lg:hidden"
        >
          Preview off
        </button>
      )}
      {!preview && (
        <button
          type="button"
          onClick={() => setPreview(true)}
          className="fixed bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <Wand2 className="h-4 w-4" />
          Preview
        </button>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="hidden items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 sm:flex">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (state === "error") {
    return <span className="text-xs text-destructive">Save failed</span>;
  }
  return null;
}

function VersionsMenu({ resumeId }: { resumeId: string }) {
  const [versions, setVersions] = useState<Array<{ version: number; createdAt: Date }> | null>(null);
  const [busyVersion, setBusyVersion] = useState<number | null>(null);

  async function load() {
    const rows = await listVersionsAction(resumeId);
    setVersions(rows.map((r) => ({ version: r.version, createdAt: r.createdAt })));
  }

  async function restore(version: number) {
    setBusyVersion(version);
    await restoreVersionAction(resumeId, version);
    setBusyVersion(null);
    window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" onMouseEnter={() => void load()} title="Version history">
          <Clock className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
        <DropdownMenuLabel>Version history</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions === null && <DropdownMenuItem disabled>Loading…</DropdownMenuItem>}
        {versions && versions.length === 0 && (
          <DropdownMenuItem disabled>No versions yet — edits are snapshotted automatically.</DropdownMenuItem>
        )}
        {versions?.map((v) => (
          <DropdownMenuItem key={v.version} onSelect={() => void restore(v.version)} disabled={busyVersion !== null}>
            <RotateCcw className="h-4 w-4" />
            {busyVersion === v.version ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>
                v{v.version} · {v.createdAt.toLocaleString()}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
