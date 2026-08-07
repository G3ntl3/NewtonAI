/**
 * Thin client helpers for the bookmark API routes.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function createBookmark({ title, subject, sourceType = 'chat' }) {
  const response = await fetch('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, subject, sourceType }),
  });
  return parseJson(response);
}
