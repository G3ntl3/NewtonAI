import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connect } from '@newton/database/src/connection.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import { RecoveryCodeRepository } from '@newton/database/src/repositories/RecoveryCodeRepository.js';
import { ROLES } from '../rbac/roles.js';

const DEFAULT_TTL_DAYS = 30;

/**
 * Normalize recovery codes for comparison (strip dashes/spaces, uppercase).
 * @param {string} code
 */
export function normalizeRecoveryCode(code) {
  return String(code || '')
    .replace(/[-\s]/g, '')
    .toUpperCase();
}

export function recoveryCodeLookupKey(code) {
  return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

/**
 * Human-readable recovery code: XXXX-XXXX-XXXX-XXXX
 */
export function generatePlainRecoveryCode() {
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export async function hashRecoveryCode(code) {
  return bcrypt.hash(normalizeRecoveryCode(code), 10);
}

/**
 * Issue a recovery code. Student signup codes never expire (expiresAt = null).
 * Returns the plain code once — never stored in plaintext.
 */
export async function issueRecoveryCode(
  userId,
  { ttlDays = DEFAULT_TTL_DAYS, neverExpires = false, createdBy = null } = {}
) {
  await connect();

  const plainCode = generatePlainRecoveryCode();
  const codeHash = await hashRecoveryCode(plainCode);
  const codeLookup = recoveryCodeLookupKey(plainCode);
  const expiresAt = neverExpires
    ? null
    : new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await RecoveryCodeRepository.create({
    userId,
    codeHash,
    codeLookup,
    expiresAt,
    createdBy,
  });

  return { code: plainCode, expiresAt };
}

/**
 * Student password reset: redeem by recovery code alone (email may be absent).
 * Keeps the same recovery code active — does not issue a new one.
 * @returns {Promise<{ user: object, recoveryCode: string }|null>}
 */
export async function resetPasswordWithRecoveryCode({ code, newPassword }) {
  await connect();

  const plainCode = String(code).trim();
  const lookup = recoveryCodeLookupKey(plainCode);
  const matched = await RecoveryCodeRepository.findActiveByLookup(lookup);
  if (!matched) {
    return null;
  }

  const ok = await bcrypt.compare(normalizeRecoveryCode(plainCode), matched.codeHash);
  if (!ok) {
    return null;
  }

  const user = await UserRepository.findById(matched.userId);
  if (!user || user.isActive === false || user.role !== ROLES.STUDENT) {
    return null;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await UserRepository.update(user._id, { passwordHash });

  return { user: updated, recoveryCode: plainCode };
}

/**
 * Redeem a recovery code (optional email filter). Prefer resetPasswordWithRecoveryCode for students.
 */
export async function redeemRecoveryCode({ email, code, newPassword }) {
  await connect();

  let user = null;
  if (email) {
    user = await UserRepository.findByEmail(String(email).trim().toLowerCase());
    if (!user || user.isActive === false) {
      return null;
    }
  }

  const lookup = recoveryCodeLookupKey(code);
  const matched = await RecoveryCodeRepository.findActiveByLookup(lookup);
  if (!matched) {
    return null;
  }

  if (user && matched.userId.toString() !== user._id.toString()) {
    return null;
  }

  const ok = await bcrypt.compare(normalizeRecoveryCode(code), matched.codeHash);
  if (!ok) {
    return null;
  }

  const owner = user || (await UserRepository.findById(matched.userId));
  if (!owner || owner.isActive === false) {
    return null;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await RecoveryCodeRepository.markUsed(matched._id);
  return UserRepository.update(owner._id, { passwordHash });
}

export default {
  generatePlainRecoveryCode,
  hashRecoveryCode,
  normalizeRecoveryCode,
  recoveryCodeLookupKey,
  issueRecoveryCode,
  redeemRecoveryCode,
  resetPasswordWithRecoveryCode,
};
