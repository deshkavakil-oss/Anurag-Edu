import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

const PRIMARY_MODEL = 'gemini-4-hydrogen';

export const FRIENDLY_AI_OVERLOAD_ERROR =
  'अभी AI सेवा पर अधिक लोड है। कृपया कुछ समय बाद दोबारा प्रयास करें। आपका प्रश्न सुरक्षित रखा गया है।';

export interface GroundedSourceLink {
  title: string;
  uri: string;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw Object.assign(new Error('GEMINI_API_KEY_MISSING'), { statusCode: 503, nonRetryable: true });
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; statusCode?: number; message?: string; nonRetryable?: boolean };
  if (e.nonRetryable) return false;
  const code = e.status ?? e.statusCode;
  if (code === 400 || code === 401 || code === 403 || code === 404) return false;
  if (code === 429 || code === 500 || code === 502 || code === 503 || code === 504) return true;
  const msg = String(e.message || '').toUpperCase();
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) return false;
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('INTERNAL') ||
    msg.includes('BAD GATEWAY') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('FETCH FAILED')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withGeminiRetry<T>(
  runner: (ai: GoogleGenAI, model: string) => Promise<T>
): Promise<T> {
  const ai = getAiClient();
  const fallbackModel = (process.env.GEMINI_FALLBACK_MODEL || '').trim();
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const modelToUse = attempt === maxRetries && fallbackModel ? fallbackModel : PRIMARY_MODEL;
      return await runner(ai, modelToUse);
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt === maxRetries) {
        break;
      }
      const baseMs = 600 * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 350);
      await sleep(baseMs + jitter);
    }
  }

  throw lastError;
}

export function extractGroundingLinks(response: GenerateContentResponse): GroundedSourceLink[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const links: GroundedSourceLink[] = [];
  for (const chunk of chunks) {
    const web = (chunk as { web?: { uri?: string; title?: string } }).web;
    if (web?.uri && !seen.has(web.uri)) {
      seen.add(web.uri);
      links.push({
        title: web.title || web.uri,
        uri: web.uri,
      });
    }
  }
  return links.slice(0, 12);
}

export function extractJsonSafely<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export { Type };
