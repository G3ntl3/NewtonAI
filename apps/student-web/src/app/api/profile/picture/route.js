// POST /api/profile/picture — multipart/form-data with a "file" field.
// Uploads to Cloudinary (packages/media, the only file allowed to import
// the Cloudinary SDK) and saves the resulting URL on the student's profile.
import { requireStudent } from '@newton/auth/src/session.js';
import { connect } from '@newton/database/src/connection.js';
import { ProfileRepository } from '@newton/database/src/repositories/ProfileRepository.js';
import { uploadProfilePicture } from '@newton/media/src/index.js';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || typeof file === 'string') {
    return jsonResponse({ ok: false, error: 'Missing file' }, 400);
  }
  if (!file.type?.startsWith('image/')) {
    return jsonResponse({ ok: false, error: 'File must be an image' }, 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse({ ok: false, error: 'Image must be under 5MB' }, 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pictureUrl = await uploadProfilePicture(buffer, student.id);
    await connect();
    await ProfileRepository.upsertByUserId(student.id, { pictureUrl });
    return jsonResponse({ ok: true, data: { pictureUrl } });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not upload picture' }, 500);
  }
}
