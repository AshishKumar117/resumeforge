import type { ResumeData } from "@/lib/types/resume";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function plainText(s?: string): string {
  return (s ?? "").replace(/<[^>]*>/g, " ");
}

/** Render resume to ATS-friendly plain text. */
export function resumeToTxt(data: ResumeData): string {
  const lines: string[] = [];
  const p = data.personal ?? { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "" };

  if (p.fullName) lines.push(p.fullName);
  if (p.jobTitle) lines.push(p.jobTitle);

  const contact: string[] = [];
  if (p.location) contact.push(p.location);
  if (p.email) contact.push(p.email);
  if (p.phone) contact.push(p.phone);
  if (p.website) contact.push(p.website);
  if (p.linkedin) contact.push(p.linkedin);
  if (p.github) contact.push(p.github);
  if (contact.length) lines.push(contact.join(" | "));
  lines.push("");

  for (const section of data.sections ?? []) {
    if (!section.visible) continue;
    lines.push(section.title.toUpperCase());
    lines.push("");
    for (const item of section.items) {
      const header: string[] = [];
      if (item.heading) header.push(item.heading);
      if (item.subheading) header.push(item.subheading);
      if (header.length) {
        const right = [item.date, item.location].filter(Boolean).join(" | ");
        lines.push(header.join(" — ") + (right ? `   (${right})` : ""));
      } else if (item.date || item.location) {
        lines.push([item.date, item.location].filter(Boolean).join(" | "));
      }
      if (item.description) {
        for (const paragraph of plainText(item.description).split(/\n+/)) {
          if (paragraph.trim()) lines.push(paragraph.trim());
        }
      }
      if (item.bullets?.length) {
        for (const b of item.bullets) {
          if (b.trim()) lines.push(`- ${plainText(b).trim()}`);
        }
      }
      if (item.skills?.length) {
        lines.push(item.skills.join(", "));
      }
      if (header.length) lines.push("");
    }
    if (section.items.length) lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Extract a sensible filename (safe, ASCII) from title. */
export function safeFilename(title: string, ext: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "resume";
  return `${base}.${ext}`;
}

export { EMAIL_RE };
