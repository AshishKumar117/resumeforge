"use client";

import React, { useMemo } from "react";
import type { ResumeData } from "@/lib/types/resume";
import { cssFontStack } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ResumePreviewProps {
  data: ResumeData;
  template?: string;
  accentColor?: string;
  font?: string;
  highlight?: string[];
  scale?: number;
  className?: string;
}

function stripHtml(s?: string): string {
  return (s ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

function SectionHeading({
  title,
  accent,
  variant,
}: {
  title: string;
  accent: string;
  variant: "bar" | "rule" | "plain";
}) {
  if (variant === "plain") {
    return (
      <div className="mb-2 mt-1">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
          {title}
        </span>
      </div>
    );
  }
  if (variant === "rule") {
    return (
      <div className="mb-2 mt-1 flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground">{title}</span>
        <span className="h-px flex-1" style={{ backgroundColor: accent }} />
      </div>
    );
  }
  return (
    <div className="mb-2 mt-1 border-l-[3px] pl-2" style={{ borderColor: accent }}>
      <span className="text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
        {title}
      </span>
    </div>
  );
}

function BulletList({ bullets, highlight }: { bullets?: string[]; highlight?: string[] }) {
  const items = (bullets ?? []).filter((b) => b.trim());
  if (!items.length) return null;
  return (
    <ul className="mt-0.5 space-y-0.5">
      {items.map((b, i) => (
        <li key={i} className="flex gap-1.5 text-sm leading-snug text-foreground/85">
          <span className="mt-px shrink-0 text-[10px] text-foreground/50">•</span>
          <span>{highlight?.length ? <KeywordHighlight text={stripHtml(b)} keywords={highlight} /> : stripHtml(b)}</span>
        </li>
      ))}
    </ul>
  );
}

function Description({ text, highlight }: { text?: string; highlight?: string[] }) {
  if (!text) return null;
  const clean = stripHtml(text);
  return (
    <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">
      {highlight?.length ? <KeywordHighlight text={clean} keywords={highlight} /> : clean}
    </p>
  );
}

function KeywordHighlight({ text, keywords }: { text: string; keywords: string[] }) {
  const parts = useMemo(() => {
    if (!keywords?.length || !text) return [text];
    const lower = text.toLowerCase();
    const matches: Array<{ i: number; len: number }> = [];
    for (const kw of keywords) {
      const needle = kw.toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx !== -1) {
        matches.push({ i: idx, len: kw.length });
        idx = lower.indexOf(needle, idx + 1);
      }
    }
    matches.sort((a, b) => a.i - b.i);
    if (!matches.length) return [text];
    const out: string[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.i < cursor) continue;
      out.push(text.slice(cursor, m.i));
      out.push(`\u0001${text.slice(m.i, m.i + m.len)}\u0001`);
      cursor = m.i + m.len;
    }
    out.push(text.slice(cursor));
    return out;
  }, [text, keywords]);

  return (
    <>
      {parts.map((p, i) =>
        p.includes("\u0001") ? (
          <mark key={i} className="rounded-sm bg-amber-300/70 px-0.5 text-foreground">
            {p.replaceAll("\u0001", "")}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

function ModernTemplate({ data, accent, highlight }: { data: ResumeData; accent: string; font: string; highlight?: string[] }) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  return (
    <div className="px-10 py-8">
      <div className="border-b-[3px] pb-4" style={{ borderColor: accent }}>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{p.fullName || "Your Name"}</h1>
        <p className="mt-1 text-[13px] font-medium" style={{ color: accent }}>
          {p.jobTitle}
        </p>
        {contact.length ? (
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[10.5px] text-foreground/60">
            {contact.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>·</span>}
                <span>{c}</span>
              </React.Fragment>
            ))}
          </p>
        ) : null}
      </div>
      {data.sections
        ?.filter((s) => s.visible)
        .map((section) => (
          <div key={section.id} className="mt-4">
            <SectionHeading title={section.title} accent={accent} variant="bar" />
            {section.items.map((item) => (
              <div key={item.id} className="mb-3">
                {(item.heading || item.subheading) && (
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[14px] font-bold text-foreground">
                      {item.heading}
                      {item.subheading ? <span className="ml-2 font-semibold text-foreground/70">{item.subheading}</span> : null}
                    </p>
                    <p className="shrink-0 text-[11px] text-foreground/50">
                      {[item.date, item.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {item.description ? (
                  <Description text={item.description} highlight={highlight} />
                ) : null}
                <BulletList bullets={item.bullets} highlight={highlight} />
                {item.skills?.length ? (
                  <p className="mt-0.5 text-sm text-foreground/85">{item.skills.join(", ")}</p>
                ) : null}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function ClassicTemplate({ data, accent, highlight }: { data: ResumeData; accent: string; font: string; highlight?: string[] }) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  return (
    <div className="px-10 py-8">
      <div className="flex flex-col items-center pb-2 text-center">
        <h1 className="text-[26px] font-semibold uppercase tracking-[0.08em]">{p.fullName || "Your Name"}</h1>
        {p.jobTitle ? <p className="mt-1 text-[12px] text-foreground/70">{p.jobTitle}</p> : null}
        <div className="mt-2 mb-1 h-[2px] w-24" style={{ backgroundColor: accent }} />
        {contact.length ? <p className="text-[10.5px] text-foreground/60">{contact.join("  |  ")}</p> : null}
      </div>
      {data.sections
        ?.filter((s) => s.visible)
        .map((section) => (
          <div key={section.id} className="mt-3">
            <div className="border-b pb-1" style={{ borderColor: accent }}>
              <span className="text-[11.5px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
                {section.title}
              </span>
            </div>
            {section.items.map((item) => (
              <div key={item.id} className="mt-2">
                {(item.heading || item.subheading) && (
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[13.5px] font-bold">
                      {item.heading}
                      {item.subheading ? <span className="font-normal italic text-foreground/70">, {item.subheading}</span> : null}
                    </p>
                    <p className="shrink-0 text-[11px] italic text-foreground/50">
                      {[item.date, item.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {item.description ? (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/85">{stripHtml(item.description)}</p>
                ) : null}
                <BulletList bullets={item.bullets} highlight={highlight} />
                {item.skills?.length ? <p className="mt-0.5 text-[13px] text-foreground/85">{item.skills.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function MinimalTemplate({ data, accent, highlight }: { data: ResumeData; accent: string; font: string; highlight?: string[] }) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  return (
    <div className="px-12 py-10">
      <h1 className="text-[30px] font-semibold leading-none tracking-tight">{p.fullName || "Your Name"}</h1>
      {p.jobTitle ? <p className="mt-1.5 text-[13px] text-foreground/60">{p.jobTitle}</p> : null}
      {contact.length ? <p className="mt-3 text-[10.5px] text-foreground/50">{contact.join("   ·   ")}</p> : null}
      {data.sections
        ?.filter((s) => s.visible)
        .map((section) => (
          <div key={section.id} className="mt-6">
            <SectionHeading title={section.title} accent={accent} variant="rule" />
            {section.items.map((item) => (
              <div key={item.id} className="mb-3">
                {(item.heading || item.subheading) && (
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[13.5px] font-semibold">
                      {item.heading}
                      {item.subheading ? <span className="font-normal text-foreground/70"> — {item.subheading}</span> : null}
                    </p>
                    <p className="shrink-0 text-[10.5px] text-foreground/45">
                      {[item.date, item.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {item.description ? (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/75">{stripHtml(item.description)}</p>
                ) : null}
                <BulletList bullets={item.bullets} highlight={highlight} />
                {item.skills?.length ? <p className="mt-0.5 text-[13px] text-foreground/75">{item.skills.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function CompactTemplate({ data, accent }: { data: ResumeData; accent: string; font: string; highlight?: string[] }) {
  const p = data.personal ?? {};
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  const sidebarTypes = ["skills", "education", "certifications", "summary"];
  const sidebar = data.sections?.filter((s) => sidebarTypes.includes(s.type) && s.visible) ?? [];
  const main = data.sections?.filter((s) => !sidebarTypes.includes(s.type) && s.visible) ?? [];
  return (
    <div className="pb-8">
      <div className="px-10 py-6 text-white" style={{ backgroundColor: accent }}>
        <h1 className="text-[24px] font-bold leading-tight">{p.fullName || "Your Name"}</h1>
        {p.jobTitle ? <p className="mt-0.5 text-[12px] opacity-90">{p.jobTitle}</p> : null}
        {contact.length ? (
          <p className="mt-2 text-[9.5px] leading-relaxed opacity-90">
            {contact.map((c, i) => (
              <React.Fragment key={i}>
                {c}
                {i < contact.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        ) : null}
      </div>
      <div className="flex gap-5 px-10 pt-5">
        <div className="w-[34%]">
          {sidebar.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="border-b pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: accent }}>
                {section.title}
              </p>
              {section.items.map((item) => (
                <div key={item.id} className="mt-1.5">
                  {item.heading ? <p className="text-[10.5px] font-semibold">{item.heading}</p> : null}
                  {item.subheading ? <p className="text-[10px] text-foreground/60">{item.subheading}</p> : null}
                  {item.description ? <p className="text-[10px] leading-snug text-foreground/75">{stripHtml(item.description)}</p> : null}
                  {item.skills?.length ? (
                    <ul className="mt-0.5 space-y-0.5">
                      {item.skills.map((s, i) => (
                        <li key={i} className="flex gap-1 text-[10px] text-foreground/80">
                          <span className="shrink-0" style={{ color: accent }}>•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="w-[66%]">
          {main.map((section) => (
            <div key={section.id} className="mb-4">
              <p className="border-b pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: accent }}>
                {section.title}
              </p>
              {section.items.map((item) => (
                <div key={item.id} className="mt-1.5">
                  {(item.heading || item.subheading) && (
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[11px] font-semibold">
                        {item.heading}
                        {item.subheading ? <span className="font-normal text-foreground/60"> — {item.subheading}</span> : null}
                      </p>
                      <p className="shrink-0 text-[9px] text-foreground/45">
                        {[item.date, item.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  )}
                  {item.description ? <p className="mt-0.5 text-[10.5px] leading-snug text-foreground/80">{stripHtml(item.description)}</p> : null}
                  <BulletList bullets={item.bullets} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_VARIANTS = {
  modern: { variant: "bar" as const, Component: ModernTemplate },
  classic: { variant: "rule" as const, Component: ClassicTemplate },
  minimal: { variant: "rule" as const, Component: MinimalTemplate },
  compact: { variant: "rule" as const, Component: CompactTemplate },
};

export function ResumePreview({
  data,
  template = "modern",
  accentColor = "#2563eb",
  font = "Inter",
  highlight,
  scale = 1,
  className,
}: ResumePreviewProps) {
  const { Component } = TEMPLATE_VARIANTS[template as keyof typeof TEMPLATE_VARIANTS] ?? TEMPLATE_VARIANTS.modern;

  return (
    <div
      className={cn("resume-sheet overflow-hidden bg-white text-zinc-900 shadow-xl", className)}
      style={{
        fontFamily: cssFontStack(font),
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <Component data={data} accent={accentColor} font={font} highlight={highlight} />
    </div>
  );
}
