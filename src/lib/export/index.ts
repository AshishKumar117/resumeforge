import { resumeToPdfBuffer } from "@/lib/export/pdf";
import { resumeToDocxBuffer } from "@/lib/export/docx";
import { resumeToTxt, safeFilename } from "@/lib/export/txt";
import type { ResumeData } from "@/lib/types/resume";

export type ExportFormat = "pdf" | "docx" | "txt";

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
};

export async function exportResume(
  data: ResumeData & { template?: string },
  settings: { accentColor?: string; font?: string },
  format: ExportFormat,
  title: string,
): Promise<ExportResult> {
  const fullData = { ...data, template: data.template ?? "modern" };

  let buffer: Buffer;
  if (format === "pdf") {
    buffer = await resumeToPdfBuffer(fullData, settings.accentColor ?? "#2563eb", settings.font ?? "Inter");
  } else if (format === "docx") {
    buffer = await resumeToDocxBuffer(fullData);
  } else {
    buffer = Buffer.from(resumeToTxt(fullData), "utf-8");
  }

  return {
    buffer,
    contentType: CONTENT_TYPES[format],
    filename: safeFilename(title, format),
  };
}
