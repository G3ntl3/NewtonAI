import { randomUUID } from 'node:crypto';
import { connect } from '../connection.js';
import Session from '../models/Session.js';

// No row-level security in Mongoose — every query here MUST filter by
// userId so a student can only ever read/write their own session.

export async function getSession(sessionId, userId) {
  if (!sessionId || !userId) return null;
  await connect();
  return Session.findOne({ sessionId: String(sessionId), userId: String(userId) }).exec();
}

export async function saveSession(sessionId, userId, patch) {
  if (!sessionId || !userId) return null;
  await connect();
  return Session.findOneAndUpdate(
    { sessionId: String(sessionId), userId: String(userId) },
    { $set: patch },
    { new: true }
  ).exec();
}

/** Starts a fresh Socratic session at revealLevel 0. */
export async function createSession({ sessionId, userId, subject, concept }) {
  await connect();
  return Session.create({ sessionId, userId: String(userId), subject, concept });
}

/**
 * Returns the student's existing chat for this subject, or starts a fresh
 * one (revealLevel 0, empty history, no concept yet). One chat per
 * (userId, subject) — enforced by the model's unique index, not just this
 * lookup-then-create. Ownership is enforced in code: always scoped to userId.
 */
export async function getOrCreateSession(userId, subject) {
  if (!userId || !subject) return null;
  await connect();

  const existing = await Session.findOne({ userId: String(userId), subject }).exec();
  if (existing) return existing;

  return Session.create({
    sessionId: randomUUID(),
    userId: String(userId),
    subject,
    concept: null,
  });
}

/**
 * The student's most recently updated chat session (any subject) that has
 * an established concept — powers the chat landing screen's "Continue
 * where you stopped" card. Ownership enforced: scoped to userId. A session
 * with no concept yet (never taught anything) is not a "lesson in
 * progress", so it's excluded.
 */
export async function findMostRecentActiveForUser(userId) {
  if (!userId) return null;
  await connect();
  return Session.findOne({ userId: String(userId), concept: { $ne: null } })
    .sort({ updatedAt: -1 })
    .exec();
}

export async function deleteAllForUser(userId) {
  await connect();
  return Session.deleteMany({ userId: String(userId) }).exec();
}
