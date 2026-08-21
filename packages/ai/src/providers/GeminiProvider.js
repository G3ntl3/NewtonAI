// packages/ai/src/providers/GeminiProvider.js
//
// THE ONLY FILE ALLOWED TO IMPORT GEMINI (blueprint §4.1).
// Swap models via NEWTON_GEMINI_MODEL — nothing else changes.
//
// Two things this file exists to get right:
//   1. Streaming — so a slow Socratic turn doesn't hit Vercel's function
//      timeout, and the student sees words appear instead of a blank spinner.
//   2. 429 handling — the free tier is ~10-15 RPM. In a classroom that WILL
//      be hit. Exponential backoff with jitter, never a tight retry loop.

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = process.env.NEWTON_GEMINI_MODEL || 'gemini-3-flash';
const API_KEY = process.env.NEWTON_GEMINI_API_KEY;

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 800;

const client = new GoogleGenerativeAI(API_KEY);

/**
 * Stream a tutoring turn. Yields text chunks as they arrive.
 * The caller accumulates chunks, then parses the full JSON at the end.
 *
 * @param {{ system: string, user: string }} prompt
 * @returns {AsyncGenerator<string>}
 */
export async function* streamTurn(prompt) {
  const model = client.getGenerativeModel({
    model: MODEL,
    systemInstruction: prompt.system,
    generationConfig: {
      responseMimeType: 'application/json', // force JSON, no markdown fences
      temperature: 0.7,
    },
  });

  let attempt = 0;
  while (true) {
    try {
      const result = await model.generateContentStream(prompt.user);
      // The SDK returns { stream, response } — two separate promises teed
      // from the same underlying SSE stream. We only ever consume `stream`
      // (below, inside this try/catch); `response` (an aggregated-response
      // promise) is never awaited. If the SSE parser hits a malformed chunk
      // it errors the source stream, which rejects BOTH — and since nothing
      // ever attaches a handler to `response`, that rejection surfaces as an
      // unhandled promise rejection that crashes past the route's try/catch,
      // instead of being caught here like a normal stream error.
      result.response.catch(() => {});
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return; // finished cleanly
    } catch (err) {
      if (!isTransient(err) || attempt >= MAX_RETRIES) throw normalize(err, attempt);
      // backoff with jitter — critical so a room full of students doesn't
      // synchronize their retries and hammer the same rolling window.
      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 400;
      await sleep(delay);
      attempt += 1;
    }
  }
}

function isRateLimit(err) {
  const status = err?.status ?? err?.response?.status;
  // Word-boundary match — a bare /rate/ also matches "generateContent" (the
  // API method name shows up in nearly every Gemini error message), which
  // was misclassifying unrelated errors (e.g. a bad model name) as 429s.
  return status === 429 || /\brate\b|\bquota\b|\b429\b/i.test(err?.message ?? '');
}

/**
 * 503 — the model is temporarily overloaded ("This model is currently
 * experiencing high demand"). Observed live on the production model, where it
 * previously failed the student's turn outright with no retry. Distinct from
 * 429: nothing about our usage is wrong, the upstream is just busy, so it is
 * exactly the kind of failure a backoff should absorb.
 */
function isOverloaded(err) {
  const status = err?.status ?? err?.response?.status;
  return status === 503 || /\b503\b|\boverloaded\b|high demand/i.test(err?.message ?? '');
}

/**
 * Transient = worth retrying. Both cases fail on the initial request, BEFORE
 * any chunk has been yielded, so a retry cannot duplicate partial output into
 * a caller that is accumulating the stream.
 */
function isTransient(err) {
  return isRateLimit(err) || isOverloaded(err);
}

/**
 * Normalised failure class for the reliability log. Deliberately covers the
 * cases the retry logic does NOT absorb, so they stop being invisible:
 *   · STREAM_PARSE — "Failed to parse stream": the SSE response was cut off
 *     mid-line. Not retried (it can fail after chunks have been yielded), so
 *     without this it left no record at all.
 *   · NETWORK — fetch never reached Google (DNS, reset, timeout). No HTTP
 *     status exists for these, so status-based checks all miss them.
 *   · UPSTREAM_404 — a model name that does not exist, which cost real
 *     debugging time to identify from terminal output alone.
 */
export function classifyError(err) {
  const status = err?.status ?? err?.response?.status;
  const msg = err?.message ?? '';
  if (isRateLimit(err)) return 'RATE_LIMITED';
  if (isOverloaded(err)) return 'UPSTREAM_503';
  if (status === 404 || /\b404\b|is not found for API version/i.test(msg)) return 'UPSTREAM_404';
  if (/failed to parse stream|error parsing json response/i.test(msg)) return 'STREAM_PARSE';
  if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN|UND_ERR/i.test(msg)) return 'NETWORK';
  return 'AI_ERROR';
}

function normalize(err, retryCount = 0) {
  const e = new Error(isRateLimit(err) ? 'RATE_LIMITED' : 'AI_ERROR');
  e.cause = err;
  e.rateLimited = isRateLimit(err);
  // Carried for the reliability log — the route records these, nothing reads
  // them for control flow.
  e.errorCode = classifyError(err);
  e.retryCount = retryCount;
  return e;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
