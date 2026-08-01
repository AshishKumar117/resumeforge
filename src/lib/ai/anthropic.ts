import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AtsAnalysis,
  GenerateCoverLetterInput,
  GenerateSummaryInput,
  ImproveBulletInput,
  KeywordSet,
} from "@/lib/ai/types";
import type { ResumeData } from "@/lib/types/resume";
import { createEmptyResumeData } from "@/lib/types/resume";
import { uid } from "@/lib/utils";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function complete(system: string, prompt: string, maxTokens = 1500): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return text.trim();
}

async function completeJson<T>(system: string, prompt: string, maxTokens = 2500): Promise<T> {
  const text = await complete(system, prompt, maxTokens);
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error("AI response did not contain JSON");
  return JSON.parse(match[0]) as T;
}

const toneInstructions: Record<string, string> = {
  PROFESSIONAL: "Use a professional, confident, and polished tone.",
  CONCISE: "Keep it tight — every word must add value. Aim for short, punchy lines.",
  CONFIDENT: "Use assertive, results-driven language. Lead with impact and ownership.",
  FRIENDLY: "Warm but still professional. Approachable and collaborative.",
};

function toneFor(tone?: string): string {
  return (tone && toneInstructions[tone]) || toneInstructions.PROFESSIONAL;
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async improveBullet({ bullet, context, tone }: ImproveBulletInput): Promise<string> {
    const prompt = `Rewrite this resume bullet point for maximum ATS impact:
- Start with a strong action verb.
- Add measurable metrics/outcomes where plausible (%, $, time saved, scale) — do not invent if not implied.
- Keep past tense for prior roles, present for current.
- Remove filler words, weak openers, and vague language.
- Return ONLY the rewritten bullet, no quotes, no explanation, no bullets list.

Original: "${bullet}"
${context ? `Context (role/company/other bullets):\n${context}\n` : ""}`;

    const result = await complete(
      `You are a senior resume writer. ${toneFor(tone)} The rewrite must stay truthful to the original.`,
      prompt,
      400,
    );
    return result.replace(/^[-•\s]+/, "").split("\n")[0].trim();
  }

  async generateSummary({ data, targetRole, tone }: GenerateSummaryInput): Promise<string> {
    const { personal, sections } = data;
    const experience = sections.find((s) => s.type === "experience");
    const skills = sections.find((s) => s.type === "skills");
    const highlights = (experience?.items ?? [])
      .slice(0, 3)
      .map((item) => `${item.heading} — ${item.subheading}${item.date ? ` (${item.date})` : ""}`)
      .join("; ");
    const skillList = (skills?.items ?? []).flatMap((i) => i.skills ?? []).slice(0, 12).join(", ");

    const prompt = `Write a 2-3 sentence professional resume summary for this person.

Name: ${personal.fullName}
Current title: ${personal.jobTitle || "N/A"}
Target role: ${targetRole || "their target role"}
Experience: ${highlights || "N/A"}
Top skills: ${skillList || "N/A"}

Requirements:
- First person implied (drop "I"), ~45-60 words, 2-3 sentences.
- Highlight experience, measurable impact, and key skills relevant to the target role.
- No generic phrases like "seeking an opportunity".
- Return ONLY the summary text.`;

    return complete(
      `You are a senior career coach writing resume summaries. ${toneFor(tone)} Never fabricate facts.`,
      prompt,
      300,
    );
  }

  async generateCoverLetter({ data, jobDescription, company, tone }: GenerateCoverLetterInput): Promise<string> {
    const { personal, sections } = data;
    const experience = sections.find((s) => s.type === "experience");
    const skills = sections.find((s) => s.type === "skills");
    const skillList = (skills?.items ?? []).flatMap((i) => i.skills ?? []).slice(0, 10).join(", ");
    const topRole = (experience?.items ?? []).find((i) => i.subheading)?.subheading;

    const prompt = `Write a compelling, tailored cover letter (~250 words, 4 short paragraphs) for:
Applicant: ${personal.fullName} (${personal.jobTitle || topRole || "candidate"})
Target company: ${company || "the company"}
Top skills: ${skillList || "N/A"}
Experience highlights: ${(experience?.items ?? []).slice(0, 3).map((i) => `${i.heading}: ${i.subheading}`).join("; ") || "N/A"}

Job description:
---
${jobDescription}
---

Requirements:
- Paragraph 1: which role + why the company/mission resonates.
- Paragraph 2-3: map 2-3 concrete skills/experiences to needs found in the job description.
- Paragraph 4: confident closing with a call to action.
- Address the letter body only (no "Dear Hiring Manager", no signature block, no subject line).
- Use markdown paragraphs separated by blank lines. Return ONLY the letter body.`;

    return complete(
      `You are a professional cover letter writer. ${toneFor(tone)} Ground every claim in the applicant's actual experience; never invent facts.`,
      prompt,
      800,
    );
  }

  async extractKeywords(jobDescription: string): Promise<KeywordSet> {
    const prompt = `Analyze this job description and extract, in JSON:
{
  "skills": ["top 20 most important hard skills/technologies, e.g. React, SQL, Figma"],
  "roles": ["role/seniority keywords, e.g. senior, lead, staff, manager, 5+ years"],
  "hardKeywords": ["other important exact phrases recruiters search for, e.g. agile, ci/cd, data-driven"]
}

Job description:
---
${jobDescription}
---

Return ONLY valid JSON.`;

    const parsed = await completeJson<Partial<KeywordSet>>(prompt, "You are an ATS keyword extraction engine. Be precise and exhaustive.", 1200);
    return {
      skills: parsed.skills ?? [],
      roles: parsed.roles ?? [],
      hardKeywords: parsed.hardKeywords ?? [],
    };
  }

  async structureResume(rawText: string): Promise<Partial<ResumeData>> {
    const prompt = `Parse this raw resume text and return a structured JSON object:
{
  "personal": {
    "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "",
    "website": "", "linkedin": ""
  },
  "sections": [
    {
      "type": "summary|experience|education|skills|projects|certifications|custom",
      "title": "Section title",
      "visible": true,
      "items": [
        {
          "heading": "Company/School/Project",
          "subheading": "Role/Degree",
          "date": "date range if present",
          "location": "location if present",
          "description": "paragraph if present",
          "bullets": ["bullet 1", "bullet 2"],
          "skills": ["skill1", "skill2"]
        }
      ]
    }
  ]
}

Rules:
- Only include sections that exist. Preserve order.
- For the skills section put all skills into items[].skills (max 3 items of grouped skills).
- Do not invent content. Keep original wording.
- Ensure every object has an "id": leave it out.

Resume text:
---
${rawText}
---

Return ONLY valid JSON.`;

    const parsed = await completeJson<Partial<ResumeData>>(prompt, "You are a resume parser that structures raw text into clean JSON. Preserve all original content verbatim.", 4000);

    const result: Partial<ResumeData> = { personal: parsed.personal, sections: [] };
    for (const section of parsed.sections ?? []) {
      const items = (section.items ?? []).map((item) => ({
        ...item,
        id: uid("itm"),
        bullets: item.bullets ?? [],
        skills: item.skills ?? [],
      }));
      result.sections?.push({
        id: uid("sec"),
        type: section.type ?? "custom",
        title: section.title || section.type || "Custom",
        visible: true,
        items,
      });
    }
    return result;
  }

  async analyzeAts(data: ResumeData, jobDescription: string): Promise<AtsAnalysis> {
    const resumeText = JSON.stringify(data);
    const prompt = `You are an ATS expert. Compare this resume against the job description and return JSON:
{
  "total": 0-100 overall match score,
  "keywordMatch": 0-100,
  "formatting": 0-100,
  "completeness": 0-100,
  "matchedKeywords": ["keywords from the JD present in the resume"],
  "missingKeywords": ["important JD keywords missing from the resume"],
  "formattingFlags": ["any ATS-breaking issues: tables, images, columns, headers/footers, uncommon fonts"],
  "suggestions": ["3-5 concrete, actionable improvements prioritized by impact"]
}

Resume JSON:
${resumeText}

Job description:
---
${jobDescription}
---

Return ONLY valid JSON with all fields.`;

    const parsed = await completeJson<Partial<AtsAnalysis>>(prompt, "You are a rigorous ATS scoring engine. Be fair and specific.", 1500);
    return {
      total: Math.round(parsed.total ?? 0),
      keywordMatch: Math.round(parsed.keywordMatch ?? 0),
      formatting: Math.round(parsed.formatting ?? 0),
      completeness: Math.round(parsed.completeness ?? 0),
      matchedKeywords: parsed.matchedKeywords ?? [],
      missingKeywords: parsed.missingKeywords ?? [],
      formattingFlags: parsed.formattingFlags ?? [],
      suggestions: parsed.suggestions ?? [],
    };
  }
}

export function normalizeStructuredResume(partial: Partial<ResumeData>): ResumeData {
  const empty = createEmptyResumeData();
  const personal = { ...empty.personal, ...(partial.personal ?? {}) };
  const sections = (partial.sections ?? []).filter((s) => s.type !== undefined);
  return { personal, sections: sections.length ? sections : empty.sections };
}
