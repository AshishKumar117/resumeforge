"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { ResumeItem, ResumeSection, SectionType } from "@/lib/types/resume";
import { SECTION_TYPE_LABELS } from "@/lib/constants";
import { generateSummaryApi, rewriteBulletApi } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface SectionHelpers {
  updateSection: (id: string, patch: Partial<ResumeSection>) => void;
  addItem: (sectionId: string) => void;
  updateItem: (sectionId: string, itemId: string, patch: Partial<ResumeItem>) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, dir: -1 | 1) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, dir: -1 | 1) => void;
}

export function SectionEditor({
  section,
  helpers,
  targetRole,
}: {
  section: ResumeSection;
  helpers: SectionHelpers;
  targetRole?: string | null;
}) {
  return (
    <div className="rounded-xl border bg-background">
      <SectionHeader section={section} helpers={helpers} />
      <div className="space-y-3 p-4">
        {section.type === "summary" ? (
          <SummaryEditor section={section} helpers={helpers} targetRole={targetRole} />
        ) : section.type === "skills" ? (
          <SkillsEditor section={section} helpers={helpers} />
        ) : section.type === "experience" || section.type === "projects" ? (
          <ExperienceItems section={section} helpers={helpers} />
        ) : (
          <SimpleItems section={section} helpers={helpers} />
        )}
        <AddItemButton section={section} helpers={helpers} />
      </div>
    </div>
  );
}

function SectionHeader({ section, helpers }: { section: ResumeSection; helpers: SectionHelpers }) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2.5">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      <input
        value={section.title}
        onChange={(e) => helpers.updateSection(section.id, { title: e.target.value })}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        aria-label="Section title"
      />
      <span className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
        {SECTION_TYPE_LABELS[section.type]}
      </span>
      <button
        type="button"
        onClick={() => helpers.updateSection(section.id, { visible: !section.visible })}
        className="rounded p-1 text-muted-foreground hover:bg-accent"
        title={section.visible ? "Hide section" : "Show section"}
      >
        {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground/50" />}
      </button>
      <button
        type="button"
        onClick={() => helpers.moveSection(section.id, -1)}
        className="rounded p-1 text-muted-foreground hover:bg-accent"
        title="Move up"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => helpers.moveSection(section.id, 1)}
        className="rounded p-1 text-muted-foreground hover:bg-accent"
        title="Move down"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Delete the "${section.title}" section and its content?`)) helpers.removeSection(section.id);
        }}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Delete section"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddItemButton({ section, helpers }: { section: ResumeSection; helpers: SectionHelpers }) {
  const label =
    section.type === "summary"
      ? null
      : section.type === "skills"
        ? "Add skill group"
        : section.type === "experience"
          ? "Add position"
          : section.type === "projects"
            ? "Add project"
            : section.type === "education"
              ? "Add school"
              : section.type === "certifications"
                ? "Add certification"
                : "Add item";
  if (!label) return null;
  return (
    <Button variant="outline" size="sm" className="w-full" onClick={() => helpers.addItem(section.id)}>
      <Plus />
      {label}
    </Button>
  );
}

function SummaryEditor({
  section,
  helpers,
  targetRole,
}: {
  section: ResumeSection;
  helpers: SectionHelpers;
  targetRole?: string | null;
}) {
  const item = section.items[0];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rewrite() {
    const current = item?.description ?? "";
    if (!current.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const text = await generateSummaryApi(
        {
          personal: {
            fullName: "",
            jobTitle: "",
            email: "",
            phone: "",
            location: "",
            website: "",
            linkedin: "",
            github: "",
          },
          sections: [],
        },
        targetRole ?? undefined,
      );
      if (!item) helpers.addItem(section.id);
      helpers.updateItem(section.id, item?.id ?? "", { description: text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Professional summary</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void rewrite()}
          disabled={busy || !(item?.description ?? "").trim()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
          Rewrite with AI
        </Button>
      </div>
      <Textarea
        value={item?.description ?? ""}
        rows={5}
        placeholder="2–3 sentences that sell you for the role…"
        onChange={(e) => {
          if (!item) helpers.addItem(section.id);
          helpers.updateItem(section.id, item?.id ?? "", { description: e.target.value });
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SkillsEditor({ section, helpers }: { section: ResumeSection; helpers: SectionHelpers }) {
  const [draft, setDraft] = useState("");
  const skills = section.items.flatMap((i) => i.skills ?? []);

  function addSkill() {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const first = section.items[0];
    if (!first) {
      helpers.addItem(section.id);
      return;
    }
    const merged = [...new Set([...(first.skills ?? []), ...parts])];
    helpers.updateItem(section.id, first.id, { skills: merged });
    setDraft("");
  }

  function removeSkill(skill: string) {
    const first = section.items[0];
    if (!first) return;
    helpers.updateItem(section.id, first.id, { skills: (first.skills ?? []).filter((s) => s !== skill) });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium"
          >
            {s}
            <button
              type="button"
              onClick={() => removeSkill(s)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {skills.length === 0 && <p className="text-xs text-muted-foreground">Add skills separated by commas.</p>}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="React, TypeScript, SQL…"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          Add
        </Button>
      </div>
    </div>
  );
}

function ExperienceItems({ section, helpers }: { section: ResumeSection; helpers: SectionHelpers }) {
  return (
    <div className="space-y-4">
      {section.items.map((item) => (
        <ExperienceItem key={item.id} item={item} section={section} helpers={helpers} />
      ))}
    </div>
  );
}

function ExperienceItem({
  item,
  section,
  helpers,
}: {
  item: ResumeItem;
  section: ResumeSection;
  helpers: SectionHelpers;
}) {
  const set = (patch: Partial<ResumeItem>) => helpers.updateItem(section.id, item.id, patch);

  return (
    <div className="rounded-lg border border-dashed p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Entry</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => helpers.moveItem(section.id, item.id, -1)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => helpers.moveItem(section.id, item.id, 1)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this entry?")) helpers.removeItem(section.id, item.id);
            }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={item.heading ?? ""} placeholder="Company" onChange={(e) => set({ heading: e.target.value })} />
        <Input value={item.subheading ?? ""} placeholder="Job title" onChange={(e) => set({ subheading: e.target.value })} />
        <Input value={item.date ?? ""} placeholder="Jan 2021 – Present" onChange={(e) => set({ date: e.target.value })} />
        <Input value={item.location ?? ""} placeholder="Location" onChange={(e) => set({ location: e.target.value })} />
      </div>

      <div className="mt-3 space-y-2">
        {(item.bullets?.length ? item.bullets : [""]).map((b, i) => (
          <BulletRow
            key={i}
            value={b}
            total={item.bullets?.length ?? 1}
            onChange={(v) => {
              const bullets = [...(item.bullets ?? [""])];
              bullets[i] = v;
              set({ bullets });
            }}
            onRemove={() => {
              const bullets = [...(item.bullets ?? [])];
              bullets.splice(i, 1);
              set({ bullets: bullets.length ? bullets : [""] });
            }}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => set({ bullets: [...(item.bullets?.filter((b) => b !== "") ?? []), ""] })}
        >
          <Plus />
          Add bullet
        </Button>
      </div>
    </div>
  );
}

function BulletRow({
  value,
  total,
  onChange,
  onRemove,
}: {
  value: string;
  total: number;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function improve() {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const text = await rewriteBulletApi(value);
      onChange(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <span className="mt-2.5 text-[10px] text-muted-foreground">•</span>
        <Textarea
          value={value}
          rows={2}
          placeholder="Start each bullet with a strong action verb…"
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[44px] flex-1 resize-y"
        />
        <div className="flex shrink-0 flex-col gap-1 pt-1">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => void improve()} disabled={busy} title="Rewrite with AI">
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-primary" />}
          </Button>
          {total > 1 && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} title="Remove bullet">
              <X className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
      {error && <p className="pl-4 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SimpleItems({ section, helpers }: { section: ResumeSection; helpers: SectionHelpers }) {
  const fields = section.type === "education" ? ["heading", "subheading", "date", "location", "description"] : ["heading", "subheading", "date"];

  return (
    <div className="space-y-4">
      {section.items.map((item) => (
        <div key={item.id} className="rounded-lg border border-dashed p-3">
          <div className="mb-2 flex justify-end gap-1">
            <button
              type="button"
              onClick={() => helpers.moveItem(section.id, item.id, -1)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => helpers.moveItem(section.id, item.id, 1)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this entry?")) helpers.removeItem(section.id, item.id);
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.includes("heading") && (
              <Input value={item.heading ?? ""} placeholder="Institution / issuer" onChange={(e) => helpers.updateItem(section.id, item.id, { heading: e.target.value })} />
            )}
            {fields.includes("subheading") && (
              <Input value={item.subheading ?? ""} placeholder="Degree / details" onChange={(e) => helpers.updateItem(section.id, item.id, { subheading: e.target.value })} />
            )}
            {fields.includes("date") && (
              <Input value={item.date ?? ""} placeholder="2018 – 2021" onChange={(e) => helpers.updateItem(section.id, item.id, { date: e.target.value })} />
            )}
            {fields.includes("location") && (
              <Input value={item.location ?? ""} placeholder="Location" onChange={(e) => helpers.updateItem(section.id, item.id, { location: e.target.value })} />
            )}
          </div>
          {fields.includes("description") && (
            <Textarea
              className="mt-2"
              value={item.description ?? ""}
              rows={2}
              placeholder="Relevant coursework, thesis, honors…"
              onChange={(e) => helpers.updateItem(section.id, item.id, { description: e.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export const SECTION_ORDER: SectionType[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "custom",
];

export function AddSectionButton({ onAdd }: { onAdd: (type: SectionType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" className="w-full" onClick={() => setOpen((o) => !o)}>
        <Plus />
        Add section
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border bg-popover p-2 shadow-lg">
          {SECTION_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              {SECTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
