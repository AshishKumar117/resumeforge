import { AnthropicProvider } from "@/lib/ai/anthropic";
import { LocalProvider } from "@/lib/ai/local";
import type { AIProvider } from "@/lib/ai/types";

const anthropic = new AnthropicProvider();
const local = new LocalProvider();

export const ai: AIProvider = process.env.ANTHROPIC_API_KEY ? anthropic : local;

/** Whether the "real" LLM is configured (used to surface a badge in the UI). */
export const aiIsConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export { AnthropicProvider, LocalProvider };
export * from "@/lib/ai/types";
