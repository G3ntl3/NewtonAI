/**
 * Thin client helper for the dashboard API route.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function fetchDashboardSummary() {
  const response = await fetch('/api/dashboard/summary', {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}
