/**
 * Thin client helpers for the flashcard API routes.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function fetchFlashcards() {
  const response = await fetch('/api/flashcards', {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}

export async function createFlashcard({ question, answer, subject }) {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question, answer, subject }),
  });
  return parseJson(response);
}
