import { describe, expect, it } from "vitest";
import {
  analyzeAtsLocal,
  extractKeywordsLocal,
  generateCoverLetterLocal,
  generateSummaryLocal,
  improveBulletLocal,
  structureResumeLocal,
} from "@/lib/ai/local";
import { createEmptyResumeData, type ResumeData } from "@/lib/types/resume";

const JD = "Senior Product Manager with experience in roadmap, SQL, A/B testing, and stakeholder management.";

function sampleResume(): ResumeData {
  const data = createEmptyResumeData();
  data.personal.fullName = "Alex Morgan";
  data.personal.jobTitle = "Senior Product Manager";
  const exp = data.sections.find((s) => s.type === "experience")!;
  exp.items = [
    {
      id: "itm1",
      heading: "Acme Corp",
      subheading: "Product Manager",
      date: "Mar 2021 – Present",
      bullets: ["Led roadmap and A/B testing programs that grew engagement."],
    },
  ];
  const skills = data.sections.find((s) => s.type === "skills")!;
  skills.items = [{ id: "itm2", skills: ["SQL", "A/B Testing", "Roadmap"] }];
  return data;
}

describe("local AI engine", () => {
  it("extracts known skills from job descriptions", () => {
    const k = extractKeywordsLocal(JD);
    expect(k.skills).toContain("sql");
    expect(k.skills).toContain("a/b testing");
    expect(k.roles).toContain("manager");
  });

  it("scores a matching resume highly", async () => {
    const result = analyzeAtsLocal(sampleResume(), JD);
    expect(result.total).toBeGreaterThan(0);
    expect(result.keywordMatch).toBeGreaterThan(50);
    expect(result.matchedKeywords.some((k) => k.includes("sql"))).toBe(true);
  });

  it("flags weak bullet openers and adds a period", () => {
    const out = improveBulletLocal({ bullet: "responsible for the dashboard", context: "" });
    expect(out.startsWith("Responsible")).toBe(false);
    expect(/\.$/.test(out)).toBe(true);
  });

  it("generates a summary mentioning the target role", () => {
    const summary = generateSummaryLocal({ data: sampleResume(), targetRole: "Senior Product Manager" });
    expect(summary.length).toBeGreaterThan(50);
    expect(summary.toLowerCase()).toContain("senior product manager");
  });

  it("generates a cover letter that names the company", () => {
    const letter = generateCoverLetterLocal({
      data: sampleResume(),
      jobDescription: JD,
      company: "Acme Corp",
    });
    expect(letter).toContain("Acme Corp");
    expect(letter.split("\n\n").length).toBeGreaterThan(2);
  });

  it("structures raw text into sections", () => {
    const raw = [
      "Alex Morgan",
      "Senior Product Manager",
      "Email: alex@example.com",
      "SUMMARY",
      "Results-driven PM.",
      "EXPERIENCE",
      "Acme Corp | Product Manager | 2021 - Present",
      "• Led roadmap",
      "SKILLS",
      "SQL, Python, Figma",
    ].join("\n");
    const result = structureResumeLocal(raw);
    expect(result.personal?.fullName).toBe("Alex Morgan");
    expect(result.personal?.email).toBe("alex@example.com");
    const types = (result.sections ?? []).map((s) => s.type);
    expect(types).toContain("summary");
    expect(types).toContain("experience");
    expect(types).toContain("skills");
  });
});
