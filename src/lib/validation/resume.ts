import { z } from "zod";
import { MAX_BULLETS_PER_ITEM, MAX_DESCRIPTION_LENGTH, MAX_SECTIONS_PER_RESUME } from "@/lib/constants";

const personalSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
  jobTitle: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
  linkedin: z.string().trim().max(200).optional().default(""),
  github: z.string().trim().max(200).optional().default(""),
});

const itemSchema = z.object({
  id: z.string(),
  heading: z.string().trim().max(200).optional().default(""),
  subheading: z.string().trim().max(200).optional().default(""),
  date: z.string().trim().max(80).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH).optional().default(""),
  bullets: z
    .array(z.string().trim().max(1000))
    .max(MAX_BULLETS_PER_ITEM)
    .optional()
    .default([]),
  skills: z.array(z.string().trim().max(60)).max(200).optional().default([]),
  level: z.number().int().min(1).max(5).optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(["summary", "experience", "education", "skills", "projects", "certifications", "custom"]),
  title: z.string().trim().min(1).max(80),
  visible: z.boolean().default(true),
  items: z.array(itemSchema).default([]),
});

export const resumeDataSchema = z.object({
  personal: personalSchema.default({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  }),
  sections: z.array(sectionSchema).max(MAX_SECTIONS_PER_RESUME).default([]),
});

export const resumeMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  template: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font: z.string().min(1),
  targetRole: z.string().trim().max(200).optional(),
});

export const createResumeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120).optional(),
  template: z.string().min(1).default("modern"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563eb"),
  font: z.string().min(1).default("Inter"),
});

export const saveResumeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  template: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font: z.string().min(1),
  data: resumeDataSchema,
  targetRole: z.string().trim().max(200).optional(),
  targetJobDescription: z.string().trim().max(20000).optional(),
});

export const jdSchema = z.object({
  jobDescription: z.string().trim().min(20, "Paste at least 20 characters of the job description").max(20000),
});

export const bulletSchema = z.object({
  bullet: z.string().trim().min(2).max(1000),
  context: z.string().trim().max(4000).optional(),
});

export const summaryPromptSchema = z.object({
  data: resumeDataSchema,
  targetRole: z.string().trim().min(1).max(200).optional(),
});

export const coverLetterSchema = z.object({
  data: resumeDataSchema,
  jobDescription: z.string().trim().min(20).max(20000),
  company: z.string().trim().max(200).optional(),
  tone: z.enum(["PROFESSIONAL", "CONCISE", "CONFIDENT", "FRIENDLY"]).optional(),
});

export type ResumeDataInput = z.infer<typeof resumeDataSchema>;
