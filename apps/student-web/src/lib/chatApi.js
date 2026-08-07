/**
 * Thin client helper for the chat session API route.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function fetchChatSession(subject) {
  const response = await fetch(`/api/chat/session?subject=${encodeURIComponent(subject)}`, {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}

export async function fetchResumeSession() {
  const response = await fetch('/api/chat/resume', {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}
