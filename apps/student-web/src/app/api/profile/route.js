// GET /api/profile — fetch the student's profile, merged with a few basic
// User fields (fullName/email/schoolName — read only, never re-asked here).
// PUT /api/profile — update the extra profile fields stored in the separate
// Profile collection (packages/database/src/models/Profile.js).
import { requireStudent } from '@newton/auth/src/session.js';
import { connect } from '@newton/database/src/connection.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import { ProfileRepository } from '@newton/database/src/repositories/ProfileRepository.js';
import { profileUpdateSchema } from '@newton/types/src/profile.js';

export const runtime = 'nodejs';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function loadProfileView(studentId) {
  await connect();
  const [user, profile] = await Promise.all([
    UserRepository.findById(studentId),
    ProfileRepository.findByUserId(studentId),
  ]);

  return {
    fullName: user?.fullName || user?.name || null,
    email: user?.email || null,
    schoolName: user?.schoolName || null,
    nickname: profile?.nickname ?? null,
    className: profile?.className ?? null,
    gender: profile?.gender ?? null,
    country: profile?.country ?? null,
    homeAddress: profile?.homeAddress ?? null,
    parentPhoneNumber: profile?.parentPhoneNumber ?? null,
    favoriteSubject: profile?.favoriteSubject ?? null,
    difficultSubject: profile?.difficultSubject ?? null,
    futureAmbition: profile?.futureAmbition ?? null,
    interestsHobby: profile?.interestsHobby ?? null,
    pictureUrl: profile?.pictureUrl ?? null,
  };
}

export async function GET(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    const data = await loadProfileView(student.id);
    return jsonResponse({ ok: true, data });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not load profile' }, 500);
  }
}

export async function PUT(request) {
  let student;
  try {
    student = await requireStudent(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  try {
    await connect();
    await ProfileRepository.upsertByUserId(student.id, parsed.data);
    const data = await loadProfileView(student.id);
    return jsonResponse({ ok: true, data });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Could not update profile' }, 500);
  }
}
