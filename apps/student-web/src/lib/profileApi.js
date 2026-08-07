/**
 * Thin client helpers for the profile API routes.
 * Cookies are set by the server; fetch uses credentials: 'include'.
 */

async function parseJson(response) {
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, status: response.status, data };
}

export async function fetchProfile() {
  const response = await fetch('/api/profile', {
    method: 'GET',
    credentials: 'include',
  });
  return parseJson(response);
}

export async function updateProfile(fields) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  });
  return parseJson(response);
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/profile/picture', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return parseJson(response);
}
