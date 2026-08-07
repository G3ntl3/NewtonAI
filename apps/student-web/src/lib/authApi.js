/**
 * Thin client helpers for auth API routes.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function signup({ fullName, password, schoolName, email, phoneNumber }) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ fullName, password, schoolName, email, phoneNumber }),
  });
  return parseJson(response);
}

export async function login({ fullName, password }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ fullName, password }),
  });
  return parseJson(response);
}

export async function resetPassword({ code, newPassword }) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code, newPassword }),
  });
  return parseJson(response);
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson(response);
}

export async function fetchMe() {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}
