export class ApiError extends Error {}

/** POST JSON and return parsed JSON; throws ApiError with the server message. */
export async function apiJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((json as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return json as T;
}

export async function rewriteBulletApi(bullet: string, context?: string): Promise<string> {
  const res = await apiJson<{ text: string }>("/api/ai/rewrite-bullet", { bullet, context });
  return res.text;
}

export async function generateSummaryApi(
  data: unknown,
  targetRole?: string,
): Promise<string> {
  const res = await apiJson<{ text: string }>("/api/ai/summary", { data, targetRole });
  return res.text;
}

export async function scoreResumeApi(
  data: unknown,
  jobDescription: string,
  resumeId?: string,
): Promise<AtsScoreResponse> {
  return apiJson<AtsScoreResponse>("/api/ats/score", { data, jobDescription, resumeId });
}

export async function generateCoverLetterApi(input: {
  data: unknown;
  jobDescription: string;
  company?: string;
  tone?: string;
}): Promise<string> {
  const res = await apiJson<{ text: string }>("/api/ai/cover-letter", input);
  return res.text;
}

export interface AtsScoreResponse {
  score: {
    total: number;
    keywordMatch: number;
    formatting: number;
    completeness: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    formattingFlags: string[];
    suggestions: string[];
    scannedAt: string;
  };
}
