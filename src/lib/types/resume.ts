/**
 * ResumeForge shared domain types.
 * The `data` column on the Resume model stores a `ResumeData` object.
 */

import { uid } from "@/lib/utils";

export type SectionType =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "custom";

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github?: string;
}

export interface ResumeItem {
  id: string;
  /** Organization / school / project / certification name */
  heading?: string;
  /** Role / degree / issuer */
  subheading?: string;
  /** Free-form date range, e.g. "Mar 2020 – Present" */
  date?: string;
  location?: string;
  /** Paragraph (summary or rich description). May contain minimal HTML. */
  description?: string;
  bullets?: string[];
  /** Skills section only */
  skills?: string[];
  /** Skill proficiency 1-5 (optional) */
  level?: number;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  items: ResumeItem[];
}

export interface ResumeData {
  personal: PersonalInfo;
  sections: ResumeSection[];
}

/** Settings stored as scalar columns on Resume. */
export interface ResumeSettings {
  template: string;
  accentColor: string;
  font: string;
}

export interface AtsScore {
  total: number;
  keywordMatch: number;
  formatting: number;
  completeness: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingFlags: string[];
  scannedAt: string;
}

export const EMPTY_PERSONAL: PersonalInfo = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
};

/** Factory for a brand-new resume data object. */
export function createEmptyResumeData(): ResumeData {
  return {
    personal: { ...EMPTY_PERSONAL },
    sections: [
      { id: uid("sec"), type: "summary", title: "Summary", visible: true, items: [] },
      { id: uid("sec"), type: "experience", title: "Experience", visible: true, items: [] },
      { id: uid("sec"), type: "education", title: "Education", visible: true, items: [] },
      { id: uid("sec"), type: "skills", title: "Skills", visible: true, items: [] },
      { id: uid("sec"), type: "projects", title: "Projects", visible: true, items: [] },
      { id: uid("sec"), type: "certifications", title: "Certifications", visible: false, items: [] },
    ],
  };
}

/** Build a default section factory keyed by type. */
export function createSection(type: SectionType, title?: string): ResumeSection {
  const defaults: Record<SectionType, { title: string; itemTemplate: ResumeItem }> = {
    summary: {
      title: "Summary",
      itemTemplate: { id: uid("itm"), description: "" },
    },
    experience: {
      title: "Experience",
      itemTemplate: { id: uid("itm"), heading: "", subheading: "", date: "", location: "", bullets: [""] },
    },
    education: {
      title: "Education",
      itemTemplate: { id: uid("itm"), heading: "", subheading: "", date: "", location: "", description: "" },
    },
    skills: {
      title: "Skills",
      itemTemplate: { id: uid("itm"), skills: [] },
    },
    projects: {
      title: "Projects",
      itemTemplate: { id: uid("itm"), heading: "", subheading: "", date: "", description: "", bullets: [""] },
    },
    certifications: {
      title: "Certifications",
      itemTemplate: { id: uid("itm"), heading: "", subheading: "", date: "" },
    },
    custom: {
      title: "Custom Section",
      itemTemplate: { id: uid("itm"), heading: "", description: "" },
    },
  };
  const def = defaults[type];
  return {
    id: uid("sec"),
    type,
    title: title ?? def.title,
    visible: true,
    items: [],
  };
}

/** Flatten all resume text for search / ATS matching. */
export function resumeToPlainText(data: ResumeData): string {
  const parts: string[] = [];
  parts.push(Object.values(data.personal ?? EMPTY_PERSONAL).filter(Boolean).join(" "));
  for (const section of data.sections ?? []) {
    if (!section.visible) continue;
    parts.push(section.title);
    for (const item of section.items) {
      parts.push(item.heading ?? "", item.subheading ?? "", item.date ?? "", item.location ?? "", item.description ?? "");
      parts.push(...(item.bullets ?? []));
      parts.push(...(item.skills ?? []));
    }
  }
  return parts.filter(Boolean).join(" ").replace(/<[^>]*>/g, " ");
}
