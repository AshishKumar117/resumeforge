import { describe, expect, it } from "vitest";
import {
  createEmptyResumeData,
  createSection,
  resumeToPlainText,
  type ResumeData,
} from "@/lib/types/resume";
import { slugify, uid } from "@/lib/utils";

describe("resume data", () => {
  it("creates an empty resume with core sections", () => {
    const data = createEmptyResumeData();
    expect(data.personal.fullName).toBe("");
    const types = data.sections.map((s) => s.type);
    expect(types).toContain("summary");
    expect(types).toContain("experience");
    expect(types).toContain("skills");
  });

  it("creates typed sections with unique ids", () => {
    const a = createSection("experience", "Work History");
    const b = createSection("experience");
    expect(a.type).toBe("experience");
    expect(a.title).toBe("Work History");
    expect(a.items).toEqual([]);
    expect(a.id).not.toBe(b.id);
  });

  it("flattens visible resume content to plain text", () => {
    const data: ResumeData = {
      personal: {
        fullName: "Ada Lovelace",
        jobTitle: "Engineer",
        email: "ada@example.com",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
      },
      sections: [
        {
          id: "s1",
          type: "experience",
          title: "Experience",
          visible: true,
          items: [
            { id: "i1", heading: "Analytical Engines", subheading: "Programmer", bullets: ["Wrote the first algorithm"] },
          ],
        },
        { id: "s2", type: "skills", title: "Skills", visible: false, items: [{ id: "i2", skills: ["hidden"] }] },
      ],
    };
    const text = resumeToPlainText(data);
    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("Wrote the first algorithm");
    expect(text).not.toContain("hidden");
  });
});

describe("utils", () => {
  it("slugifies strings deterministically", () => {
    expect(slugify("Alex Morgan Resume!")).toBe("alex-morgan-resume");
    expect(slugify("  Product-Manager  ")).toBe("product-manager");
  });

  it("generates prefixed unique ids", () => {
    expect(uid("sec")).toMatch(/^sec_/);
    expect(uid()).toMatch(/^id_/);
  });
});
