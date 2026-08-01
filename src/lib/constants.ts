/**
 * Shared app constants: plan limits, template registry metadata, fonts,
 * accent palettes, and canonical string values used across the product.
 */

// ---------------------------------------------------------------------------
// Plans & gating
// ---------------------------------------------------------------------------

export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export interface PlanLimits {
  maxResumes: number;
  aiCallsPerDay: number;
  atsScansPerDay: number;
  allowTemplates: string[];
  allowExports: string[]; // pdf | docx | txt | email
  allowImport: boolean;
  allowShare: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxResumes: 3,
    aiCallsPerDay: 10,
    atsScansPerDay: 3,
    allowTemplates: ["modern", "classic"],
    allowExports: ["pdf"],
    allowImport: false,
    allowShare: true,
  },
  PRO: {
    maxResumes: 999,
    aiCallsPerDay: 200,
    atsScansPerDay: 50,
    allowTemplates: ["modern", "classic", "minimal", "compact"],
    allowExports: ["pdf", "docx", "txt", "email"],
    allowImport: true,
    allowShare: true,
  },
};

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === PLANS.PRO;
}

// ---------------------------------------------------------------------------
// Experience levels / job statuses / AI features
// ---------------------------------------------------------------------------

export const EXPERIENCE_LEVELS = [
  { value: "ENTRY", label: "Entry level (0-1 yrs)" },
  { value: "JUNIOR", label: "Junior (1-3 yrs)" },
  { value: "MID", label: "Mid-level (3-6 yrs)" },
  { value: "SENIOR", label: "Senior (6-10 yrs)" },
  { value: "LEAD", label: "Lead / Manager (10+ yrs)" },
  { value: "EXECUTIVE", label: "Executive" },
] as const;

export const JOB_STATUSES = [
  { value: "APPLIED", label: "Applied", color: "bg-sky-500" },
  { value: "INTERVIEW", label: "Interview", color: "bg-amber-500" },
  { value: "OFFER", label: "Offer", color: "bg-emerald-500" },
  { value: "REJECTED", label: "Rejected", color: "bg-rose-500" },
  { value: "WITHDRAWN", label: "Withdrawn", color: "bg-zinc-500" },
] as const;

export const AI_FEATURES = {
  IMPROVE_BULLET: "IMPROVE_BULLET",
  SUMMARY: "SUMMARY",
  COVER_LETTER: "COVER_LETTER",
  ATS_ANALYZE: "ATS_ANALYZE",
  IMPORT: "IMPORT",
} as const;

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: "BASIC" | "PRO";
  fonts: string[];
  accentColors: string[];
  atsSafe: boolean;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean sidebar-free single column with a bold header band.",
    category: "BASIC",
    fonts: ["Inter", "Roboto", "Lato"],
    accentColors: ["#2563eb", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b"],
    atsSafe: true,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless serif layout preferred by traditional industries.",
    category: "BASIC",
    fonts: ["Georgia", "Merriweather", "Times New Roman"],
    accentColors: ["#1e293b", "#0f766e", "#6b7280", "#7c3aed"],
    atsSafe: true,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean, maximum whitespace, typography-first design.",
    category: "PRO",
    fonts: ["Inter", "Montserrat", "Roboto"],
    accentColors: ["#18181b", "#334155", "#4d7c0f", "#0369a1"],
    atsSafe: true,
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense two-column skills sidebar for experienced candidates.",
    category: "PRO",
    fonts: ["Roboto", "Inter", "Lato"],
    accentColors: ["#1d4ed8", "#047857", "#b91c1c", "#6d28d9"],
    atsSafe: true,
  },
];

export function getTemplateMeta(id: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

export const FONTS = [
  { value: "Inter", label: "Inter", serif: false },
  { value: "Roboto", label: "Roboto", serif: false },
  { value: "Lato", label: "Lato", serif: false },
  { value: "Montserrat", label: "Montserrat", serif: false },
  { value: "Georgia", label: "Georgia", serif: true },
  { value: "Merriweather", label: "Merriweather", serif: true },
  { value: "Times New Roman", label: "Times New Roman", serif: true },
] as const;

/** Maps an app font to an @react-pdf/renderer built-in font. */
export function pdfFont(font: string): string {
  switch (font) {
    case "Georgia":
    case "Merriweather":
    case "Times New Roman":
      return "Times-Roman";
    case "Montserrat":
    case "Roboto":
    case "Lato":
    case "Inter":
    default:
      return "Helvetica";
  }
}

/** Maps an app font to a Google Fonts CSS stack. */
export function cssFontStack(font: string): string {
  const serif = FONTS.find((f) => f.value === font)?.serif;
  return serif
    ? `${font}, Georgia, 'Times New Roman', serif`
    : `${font}, 'Segoe UI', system-ui, -apple-system, sans-serif`;
}

// ---------------------------------------------------------------------------
// Accent palette
// ---------------------------------------------------------------------------

export const ACCENT_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#8b5cf6",
  "#f43f5e",
  "#f59e0b",
  "#1e293b",
  "#0f766e",
] as const;

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const SECTION_TYPE_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  custom: "Custom",
};

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_BULLETS_PER_ITEM = 12;
export const MAX_SECTIONS_PER_RESUME = 12;
