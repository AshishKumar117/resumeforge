import type { ResumeData } from "@/lib/types/resume";

export interface ImproveBulletInput {
  bullet: string;
  context?: string; // surrounding bullets / role context for tone
  tone?: string; // PROFESSIONAL | CONCISE | CONFIDENT | FRIENDLY
}

export interface GenerateSummaryInput {
  data: ResumeData;
  targetRole?: string;
  tone?: string;
}

export interface GenerateCoverLetterInput {
  data: ResumeData;
  jobDescription: string;
  company?: string;
  tone?: string;
}

export interface KeywordSet {
  skills: string[];
  roles: string[];
  hardKeywords: string[];
}

export interface AtsAnalysis {
  total: number;
  keywordMatch: number;
  formatting: number;
  completeness: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingFlags: string[];
  suggestions: string[];
}

export interface AIProvider {
  readonly name: string;
  improveBullet(input: ImproveBulletInput): Promise<string>;
  generateSummary(input: GenerateSummaryInput): Promise<string>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<string>;
  extractKeywords(jobDescription: string): Promise<KeywordSet>;
  structureResume(rawText: string): Promise<Partial<ResumeData>>;
  analyzeAts(data: ResumeData, jobDescription: string): Promise<AtsAnalysis>;
}
