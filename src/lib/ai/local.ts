/**
 * Deterministic, zero-dependency AI fallback engine.
 * Used when no ANTHROPIC_API_KEY is configured so the product is fully
 * functional locally and in demo environments. All heuristics.
 */

import type {
  AIProvider,
  AtsAnalysis,
  GenerateCoverLetterInput,
  GenerateSummaryInput,
  ImproveBulletInput,
  KeywordSet,
} from "@/lib/ai/types";
import type { ResumeData, ResumeSection, SectionType } from "@/lib/types/resume";
import { resumeToPlainText } from "@/lib/types/resume";
import { uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// NLP primitives
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(
  `a an the and or but if then else for of in on at to from by with without about after before between into through during above below up down out off over under again further once here there when where why how all any both each few more most other some such no nor not only own same so than too very s t can will just don should now`.split(
    /\s+/,
  ),
);

const SKILL_DICTIONARY = [
  // Programming languages
  "javascript", "typescript", "python", "java", "c++", "c#", "c", "go", "golang", "rust", "ruby", "php", "swift",
  "kotlin", "scala", "haskell", "perl", "shell", "bash", "powershell", "sql", "html", "css", "sass", "less",
  "graphql", "rest", "dart", "r", "matlab", "groovy", "elixir", "erlang", "lua", "objective-c", "visual basic",
  // Frameworks & libraries
  "react", "react native", "next.js", "nextjs", "vue", "nuxt", "angular", "svelte", "sveltekit", "ember",
  "backbone", "jquery", "node", "node.js", "express", "nest", "nestjs", "fastify", "django", "flask", "fastapi",
  "spring", "spring boot", "rails", "laravel", "symfony", "asp.net", "blazor", ".net", ".net core", "dotnet",
  "flutter", "redux", "zustand", "redux toolkit", "tailwind", "tailwind css", "bootstrap", "material ui", "ant design",
  "gatsby", "astro", "remix", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "opencv",
  "hugging face", "langchain", "hadoop", "spark", "apache spark", "kafka", "airflow", "dbt",
  // DevOps / infra / cloud
  "aws", "azure", "gcp", "google cloud", "kubernetes", "k8s", "docker", "terraform", "ansible", "puppet", "chef",
  "jenkins", "github actions", "gitlab ci", "circleci", "travis", "ci/cd", "nginx", "apache", "linux", "unix",
  "windows", "macos", "serverless", "lambda", "ec2", "s3", "rds", "dynamodb", "cloudformation", "helm", "istio",
  "prometheus", "grafana", "datadog", "new relic", "sentry", "elk", "elasticsearch", "logstash", "kibana", "splunk",
  "vault", "consul", "rancher", "openshift", "firebase", "supabase", "vercel", "netlify", "cloudflare", "heroku",
  // Data & databases
  "postgresql", "postgres", "mysql", "mariadb", "mongodb", "redis", "sqlite", "cassandra", "couchdb", "neo4j",
  "oracle", "mssql", "sql server", "elasticsearch", "snowflake", "bigquery", "redshift", "databricks", "etl",
  "data warehousing", "data engineering", "oltp", "olap", "influxdb", "timescale",
  // Testing
  "jest", "vitest", "mocha", "chai", "cypress", "playwright", "selenium", "puppeteer", "junit", "pytest",
  "unit testing", "integration testing", "e2e testing", "tdd", "test driven development", "karma", "enzyme",
  "react testing library",
  // Concepts
  "agile", "scrum", "kanban", "devops", "microservices", "monolith", "serverless architecture", "api design",
  "restful api", "web development", "full-stack", "front-end", "backend", "mobile development", "cloud computing",
  "system design", "architecture", "object-oriented", "oop", "functional programming", "design patterns",
  "algorithms", "data structures", "machine learning", "deep learning", "nlp", "natural language processing",
  "computer vision", "ai", "generative ai", "llm", "prompt engineering", "data science", "data analysis",
  "data visualization", "business intelligence", "a/b testing", "statistics", "probability", "linear regression",
  // Project/product
  "project management", "product management", "stakeholder management", "roadmapping", "prioritization",
  "requirements analysis", "user research", "usability", "ux", "ui", "figma", "sketch", "adobe xd", "photoshop",
  "illustrator", "webflow", "framer", "prototyping", "wireframing",
  // Soft/business skills
  "leadership", "mentoring", "mentorship", "communication", "collaboration", "teamwork", "cross-functional",
  "presentation", "public speaking", "negotiation", "customer success", "client relations", "sales",
  "marketing", "seo", "sem", "content strategy", "branding", "growth", "analytics", "google analytics",
  "financial analysis", "budgeting", "forecasting", "p&l", "revenue", "kpi", "okr", "sla",
].map((s) => s.toLowerCase());

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Extract keywords from text using the skill dictionary + frequency. */
export function extractKeywordsLocal(text: string): KeywordSet {
  const lower = text.toLowerCase();
  const matched = new Set<string>();
  for (const skill of SKILL_DICTIONARY) {
    if (lower.includes(skill)) matched.add(skill);
  }

  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (STOPWORDS.has(t) || t.length < 4) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const frequent = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w]) => w);

  const seniorityWords = ["senior", "lead", "staff", "principal", "manager", "leadership", "head of", "director", "vp", "junior", "mid-level", "entry-level"];

  return {
    skills: [...matched],
    roles: seniorityWords.filter((w) => lower.includes(w)),
    hardKeywords: frequent.filter((w) => !matched.has(w)).slice(0, 15),
  };
}

// ---------------------------------------------------------------------------
// Bullet improvement (heuristic)
// ---------------------------------------------------------------------------

const STRONG_VERBS = [
  "Spearheaded", "Architected", "Led", "Delivered", "Launched", "Drove", "Engineered", "Built", "Designed",
  "Optimized", "Improved", "Reduced", "Increased", "Streamlined", "Automated", "Implemented", "Developed",
  "Orchestrated", "Negotiated", "Mentored", "Founded", "Scaled", "Accelerated", "Transformed", "Championed",
];

const WEAK_OPENERS = /^(responsible for|duties included|helped (to )?|worked on|tasked with|in charge of|was responsible for|participated in)/i;

function inferTense(bullet: string): "past" | "present" {
  const pastMarkers = /\b(managed|built|led|created|developed|implemented|designed|delivered|launched|reduced|increased|improved|spearheaded|drove|optimized|automated|streamlined|saved|grew|negotiated|mentored|founded|scaled|won|achieved)\b/;
  return pastMarkers.test(bullet) ? "past" : "present";
}

export function improveBulletLocal({ bullet, context }: ImproveBulletInput): string {
  let line = bullet.trim().replace(/^[-•*]\s*/, "").replace(/[.;]+$/, "");
  if (!line) return bullet;

  const tense = inferTense(line);
  const verb = STRONG_VERBS[line.length % STRONG_VERBS.length];

  if (WEAK_OPENERS.test(line)) {
    line = line.replace(WEAK_OPENERS, verb + "d");
  } else {
    line = line.charAt(0).toUpperCase() + line.slice(1);
  }

  // Prefer an action-verb start if it starts with a noun phrase like "The..." or "Managed the team's X"
  const startsWithNoun = /^(the|my|our|a|an|i)\s/i.test(line);
  if (startsWithNoun) {
    line = line.replace(/^(the|my|our|a|an|i)\s+/i, `${verb}${tense === "past" ? "d" : "s"} `);
  }

  // Add a metrics scaffold only when a metric is implied by context.
  const hasMetric = /\d|\b%\b|\$\b|\busers?\b|\bclients?\b|\btime\b/i.test(line);
  if (!hasMetric && (context ?? "").toLowerCase().includes("impact")) {
    line = `${line}, improving efficiency by X%`;
  }

  line = line.replace(/\s+/g, " ").trim();
  if (!/[.!?]$/.test(line)) line += ".";
  return line;
}

// ---------------------------------------------------------------------------
// Summary generation (template)
// ---------------------------------------------------------------------------

export function generateSummaryLocal({ data, targetRole, tone }: GenerateSummaryInput): string {
  const { personal, sections } = data;
  const experience = sections.find((s) => s.type === "experience");
  const skills = sections.find((s) => s.type === "skills");
  const projects = sections.find((s) => s.type === "projects");

  const role = targetRole || personal.jobTitle || "their target role";
  const yearsExp = estimateYears(experience);
  const skillList = (skills?.items ?? []).flatMap((i) => i.skills ?? []).slice(0, 8).join(", ");
  const topCompany = experience?.items?.[0]?.heading;

  const parts: string[] = [];
  parts.push(
    `${personal.fullName || "Experienced professional"} with ${yearsExp} of experience specializing in ${skillList || "building and shipping software"}.`,
  );
  if (topCompany) {
    parts.push(
      `Known for delivering high-impact results at ${topCompany}${experience.items.length > 1 ? ` and ${experience.items.length - 1} other organizations` : ""}.`,
    );
  }
  if (projects?.items?.length) {
    parts.push(`Portfolio includes ${projects.items.length} hands-on projects.`);
  }
  const closing = `Aiming to apply deep expertise to a ${role} position.`;

  if (tone === "CONCISE") {
    return `${personal.fullName || "Professional"}: ${skillList || "multi-disciplinary"}. ${yearsExp} yrs experience${topCompany ? ` (${topCompany})` : ""}. ${closing}`;
  }
  if (tone === "FRIENDLY") {
    return `I'm ${personal.fullName || "an experienced professional"} — after ${yearsExp} years working on ${skillList || "exciting products"}, I love turning complex problems into clear, measurable wins. I'd be thrilled to bring that energy to a ${role} role.`;
  }
  parts.push(closing);
  return parts.join(" ");
}

function estimateYears(section?: ResumeSection): string {
  const dates = (section?.items ?? []).map((i) => i.date ?? "").join(" ");
  const yearMatches = dates.match(/(19|20)\d{2}/g);
  if (!yearMatches || yearMatches.length < 2) return "3+";
  const years = [...yearMatches.map(Number)].sort((a, b) => a - b);
  return `${Math.max(1, years[years.length - 1] - years[0])}+`;
}

// ---------------------------------------------------------------------------
// Cover letter (template)
// ---------------------------------------------------------------------------

export function generateCoverLetterLocal({ data, jobDescription, company }: GenerateCoverLetterInput): string {
  const { sections } = data;
  const experience = sections.find((s) => s.type === "experience");
  const skills = sections.find((s) => s.type === "skills");
  const skillList = (skills?.items ?? []).flatMap((i) => i.skills ?? []).slice(0, 6).join(", ");
  const topExperience = experience?.items?.[0];
  const keywords = extractKeywordsLocal(jobDescription);
  const needed = keywords.skills.slice(0, 4).join(", ");

  const paras = [
    `I am writing to express my interest in the open role${company ? ` at ${company}` : ""}. With a background in ${skillList || "delivering high-impact work"} and a track record of turning ambiguous problems into shipped outcomes, I believe I would be a strong addition to your team.`,
  ];

  if (topExperience) {
    paras.push(
      `In my most recent role as ${topExperience.subheading || "team member"} at ${topExperience.heading || "my previous company"}, I focused on ${needed || "delivering measurable results"} and consistently exceeded expectations. That experience taught me how to balance speed, quality, and stakeholder alignment in fast-moving environments.`,
    );
  } else {
    paras.push(`My work is rooted in ${needed || "the skills this role demands"} — I enjoy going deep, staying curious, and owning outcomes end to end.`);
  }

  paras.push(
    `Reviewing the requirements, I see clear overlap with my expertise in ${needed || skillList || "the core responsibilities of this role"}. I am eager to bring that experience to ${company || "your organization"} and help the team achieve its goals.`,
  );
  paras.push(`Thank you for your consideration. I would welcome the opportunity to discuss how I can contribute.`);

  return paras.join("\n\n");
}

// ---------------------------------------------------------------------------
// Resume structuring from raw text (heuristic parser)
// ---------------------------------------------------------------------------

const SECTION_HEADERS: Record<string, SectionType> = {
  summary: "summary",
  objective: "summary",
  profile: "summary",
  about: "summary",
  "professional summary": "summary",
  experience: "experience",
  "work experience": "experience",
  employment: "experience",
  "professional experience": "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  "core competencies": "skills",
  projects: "projects",
  "personal projects": "projects",
  certifications: "certifications",
  "certifications & licenses": "certifications",
  licenses: "certifications",
  awards: "custom",
  languages: "custom",
  publications: "custom",
  volunteering: "custom",
  volunteer: "custom",
  references: "custom",
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|io|dev|org|net|co|me|app))\S*/i;
const DATE_RE = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s?\d{4}|\b(?:19|20)\d{2}\b|present/i;

function isSectionHeader(line: string): { type: SectionType; title: string } | null {
  const clean = line.trim().replace(/[:\-—•*#]/g, "").toLowerCase().trim();
  if (clean.length === 0 || clean.length > 40) return null;
  if (SECTION_HEADERS[clean]) return { type: SECTION_HEADERS[clean], title: line.trim() };
  // All-caps short line => likely a header.
  const stripped = line.replace(/[^a-zA-Z ]/g, "").trim();
  if (stripped.length >= 3 && stripped.length <= 30 && stripped === stripped.toUpperCase()) {
    return { type: "custom", title: line.trim() };
  }
  return null;
}

function isBulletLine(line: string): boolean {
  return /^[-•*·◦‣▪]\s|^\d+[.)]\s|^\u2022/.test(line.trim());
}

export function structureResumeLocal(rawText: string): Partial<ResumeData> {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const personal = { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "" };
  const sections: ResumeSection[] = [];
  let currentType: SectionType | null = null;
  let current: ResumeSection | null = null;
  let currentItem: ResumeSection["items"][number] | null = null;
  let firstNameSeen = false;

  const pushItem = () => {
    if (!current || !currentItem) return;
    if (
      currentItem.heading ||
      currentItem.subheading ||
      currentItem.description ||
      (currentItem.bullets?.length && currentItem.bullets.some(Boolean)) ||
      currentItem.skills?.length
    ) {
      current.items.push(currentItem);
    }
    currentItem = null;
  };

  const ensureSection = (type: SectionType, title: string) => {
    if (currentType !== type) {
      pushItem();
      current = { id: uid("sec"), type, title, visible: true, items: [] };
      sections.push(current);
      currentType = type;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const emailMatch = line.match(EMAIL_RE);
    if (emailMatch) personal.email = emailMatch[0];

    const phoneMatch = line.match(PHONE_RE);
    if (phoneMatch && !/@/.test(line)) personal.phone = phoneMatch[1].replace(/[().]/g, "").trim();

    const urlMatch = line.match(URL_RE);
    if (urlMatch && /linkedin/i.test(urlMatch[0])) personal.linkedin = urlMatch[0];
    else if (urlMatch && /github/i.test(urlMatch[0])) personal.github = urlMatch[0];
    else if (urlMatch && !emailMatch) personal.website = urlMatch[0];

    const header = isSectionHeader(line);
    if (header) {
      ensureSection(header.type, header.title);
      continue;
    }

    if (!currentType) {
      // Header block: name then title, before any section starts.
      if (!firstNameSeen) {
        personal.fullName = line;
        firstNameSeen = true;
      } else if (!personal.jobTitle && line.length < 80) {
        personal.jobTitle = line;
      }
      continue;
    }

    const isBullet = isBulletLine(line);

    if (currentType === "skills") {
      const clean = line.replace(/^[-•*]\s*/, "");
      if (clean.includes(",")) {
        ensureSection("skills", "Skills");
        const skills = clean.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 40);
        currentItem = { id: uid("itm"), skills };
        pushItem();
      } else {
        currentItem = { id: uid("itm"), skills: [clean] };
        pushItem();
      }
      continue;
    }

    if (isBullet) {
      if (!current) {
        current = { id: uid("sec"), type: "experience", title: "Experience", visible: true, items: [] };
        sections.push(current);
      }
      if (!currentItem) {
        currentItem = { id: uid("itm") };
        current.items.push(currentItem);
      }
      currentItem.bullets = [...(currentItem.bullets ?? []), line.replace(/^[-•*]\s*/, "")];
      continue;
    }

    const hasDate = DATE_RE.test(line);
    const looksLikeEntry = hasDate && !isBullet;

    if (looksLikeEntry || (currentItem && (currentItem.heading || currentItem.subheading))) {
      pushItem();
      currentItem = { id: uid("itm") };
      const dateMatch = line.match(/((?:19|20)\d{2})[^\d]*((?:19|20)\d{2}|present)|((?:19|20)\d{2})/i);
      if (hasDate) {
        currentItem.date = line.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s?\d{0,4}[\s–-]*(?:present|(?:19|20)\d{2})|\b(?:19|20)\d{2}[\s–-]*(?:present|(?:19|20)\d{2})/i)?.[0] ?? dateMatch?.[0];
      }
      const noDate = line.replace(DATE_RE, "").replace(/[-–—|,]+/g, "|").split("|").map((s) => s.trim()).filter(Boolean);
      if (noDate.length >= 2) {
        currentItem.heading = noDate[0];
        currentItem.subheading = noDate[1];
      } else if (noDate.length === 1) {
        currentItem.heading = noDate[0];
      }
      continue;
    }

    // Paragraph / description line
    if (!currentItem) currentItem = { id: uid("itm") };
    currentItem.description = [currentItem.description, line].filter(Boolean).join(" ");
  }
  pushItem();

  // Drop empty placeholder sections; ensure skills items are deduped.
  for (const section of sections) {
    if (section.type === "skills") {
      const seen = new Set<string>();
      section.items = section.items
        .flatMap((item) => item.skills ?? [])
        .filter((s) => (seen.has(s.toLowerCase()) ? false : (seen.add(s.toLowerCase()), true)))
        .reduce<typeof section.items>((acc, skill, idx) => {
          const bucket = Math.floor(idx / 20);
          if (!acc[bucket]) acc[bucket] = { id: uid("itm"), skills: [] };
          acc[bucket].skills!.push(skill);
          return acc;
        }, []);
    }
  }

  return { personal, sections };
}

// ---------------------------------------------------------------------------
// Local ATS analysis
// ---------------------------------------------------------------------------

export function analyzeAtsLocal(data: ResumeData, jobDescription: string): AtsAnalysis {
  const resumeText = resumeToPlainText(data).toLowerCase();

  const keywords = extractKeywordsLocal(jobDescription);
  const allKeywords = [...new Set([...keywords.skills, ...keywords.roles, ...keywords.hardKeywords])].filter((k) => k.length > 2);
  const searchTerms = allKeywords.map((k) => (/\s/.test(k) ? k : k));

  const matched = searchTerms.filter((k) => resumeText.includes(k));
  const missing = searchTerms.filter((k) => !resumeText.includes(k)).slice(0, 25);
  const keywordMatch = searchTerms.length ? Math.round((matched.length / searchTerms.length) * 100) : 100;

  // Formatting safety: flag ATS-breaking constructs in the resume.
  const formattingFlags: string[] = [];
  if (/\|/.test(resumeText)) formattingFlags.push("Potential table/column characters detected");
  if (/[^\x00-\x7F]/.test(resumeText)) formattingFlags.push("Special characters detected (could corrupt parsing)");
  if (!/^[a-z0-9\s.,#%+\-:()@/'"\u2022]+$/i.test(resumeText)) formattingFlags.push("Unusual symbols detected");
  const formatting = formattingFlags.length ? 100 - Math.min(30, formattingFlags.length * 15) : 100;

  // Section completeness.
  const sectionChecks: Array<[string, boolean]> = [
    ["name", Boolean(data.personal?.fullName?.trim())],
    ["contact info", Boolean(data.personal?.email || data.personal?.phone || data.personal?.linkedin)],
    ["summary", Boolean(data.sections?.find((s) => s.type === "summary")?.items?.length)],
    ["experience", Boolean(data.sections?.find((s) => s.type === "experience")?.items?.length)],
    ["education", Boolean(data.sections?.find((s) => s.type === "education")?.items?.length)],
    ["skills", Boolean(data.sections?.find((s) => s.type === "skills")?.items?.length)],
  ];
  const completed = sectionChecks.filter(([, ok]) => ok).length;
  const completeness = Math.round((completed / sectionChecks.length) * 100);

  const total = Math.round(keywordMatch * 0.55 + formatting * 0.2 + completeness * 0.25);

  const suggestions: string[] = [];
  if (missing.length) suggestions.push(`Add missing keywords: ${missing.slice(0, 6).join(", ")}`);
  if (keywordMatch < 60) suggestions.push("Strengthen keyword coverage — mirror the exact terminology from the job description.");
  if (!sectionChecks[1][1]) suggestions.push("Add contact information (email, phone, or LinkedIn URL).");
  if (!sectionChecks[4][1]) suggestions.push("Add an education section — many ATS filters require it.");
  if (formattingFlags.length) suggestions.push(`Fix formatting: ${formattingFlags.join("; ").toLowerCase()}`);
  suggestions.push("Quantify achievements with numbers to outperform 80% of candidates.");

  return {
    total,
    keywordMatch,
    formatting,
    completeness,
    matchedKeywords: matched.slice(0, 30),
    missingKeywords: missing.slice(0, 30),
    formattingFlags,
    suggestions: suggestions.slice(0, 5),
    // scannedAt set by caller
  } as AtsAnalysis;
}

export class LocalProvider implements AIProvider {
  readonly name = "local";

  improveBullet(input: ImproveBulletInput): Promise<string> {
    return Promise.resolve(improveBulletLocal(input));
  }

  generateSummary(input: GenerateSummaryInput): Promise<string> {
    return Promise.resolve(generateSummaryLocal(input));
  }

  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string> {
    return Promise.resolve(generateCoverLetterLocal(input));
  }

  extractKeywords(jobDescription: string): Promise<KeywordSet> {
    return Promise.resolve(extractKeywordsLocal(jobDescription));
  }

  structureResume(rawText: string): Promise<Partial<ResumeData>> {
    return Promise.resolve(structureResumeLocal(rawText));
  }

  analyzeAts(data: ResumeData, jobDescription: string): Promise<AtsAnalysis> {
    return Promise.resolve(analyzeAtsLocal(data, jobDescription));
  }
}
