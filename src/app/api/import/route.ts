import { NextResponse } from "next/server";
import { apiError, requireApiUser } from "@/lib/api/helpers";
import { limitsFor } from "@/lib/billing/gating";
import { ai } from "@/lib/ai";

const MAX_BYTES = 10 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const limits = limitsFor(user);
  if (!limits.allowImport) {
    return apiError("Importing an existing resume is a Pro feature. Upgrade to unlock it.", 403);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) return apiError("No file uploaded");
  if (file.size > MAX_BYTES) return apiError("File is too large (max 10 MB)");

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let rawText: string;
  try {
    if (name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        rawText = result.text ?? "";
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? "";
    } else {
      return apiError("Unsupported file type. Upload a PDF or DOCX resume.");
    }
  } catch (e) {
    return apiError(e instanceof Error ? `Failed to read file: ${e.message}` : "Failed to read file", 422);
  }

  rawText = rawText.trim();
  if (rawText.length < 20) return apiError("Couldn't extract text from this file. It may be image-based (scanned).", 422);

  try {
    const structured = await ai.structureResume(rawText);
    return NextResponse.json({ data: structured, rawText: rawText.slice(0, 50_000) });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Structuring failed", 502);
  }
}
