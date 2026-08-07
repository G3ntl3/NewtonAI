import { z } from 'zod';

/**
 * @typedef {'student'|'teacher'|'parent'|'school_admin'|'super_admin'} UserRole
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} [email]
 * @property {string} [phoneNumber]
 * @property {UserRole} role
 * @property {string} [fullName]
 * @property {string} [schoolName]
 * @property {string} [schoolId]
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  SCHOOL_ADMIN: 'school_admin',
  SUPER_ADMIN: 'super_admin',
});

export const userRoleSchema = z.enum([
  ROLES.STUDENT,
  ROLES.TEACHER,
  ROLES.PARENT,
  ROLES.SCHOOL_ADMIN,
  ROLES.SUPER_ADMIN,
]);

/** Exactly three whitespace-separated name parts. */
export const fullNameSchema = z
  .string()
  .trim()
  .refine((value) => value.split(/\s+/).filter(Boolean).length === 3, {
    message: 'Full name must contain exactly three names (first middle last)',
  })
  .transform((value) => value.split(/\s+/).filter(Boolean).join(' '));

const emptyToUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
};

export const loginRequestSchema = z.object({
  fullName: fullNameSchema,
  password: z.string().min(1),
});

/** Student self-registration — email and phone are optional. */
export const studentSignupRequestSchema = z.object({
  fullName: fullNameSchema,
  password: z.string().min(8).max(128),
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  phoneNumber: z.preprocess(emptyToUndefined, z.string().min(7).max(20).optional()),
  schoolName: z.string().trim().min(2).max(120),
});

/** @deprecated Prefer studentSignupRequestSchema for student-web */
export const signupRequestSchema = studentSignupRequestSchema;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

/** Student password reset via recovery code only (no email required). */
export const resetPasswordRequestSchema = z.object({
  code: z.string().min(6),
  newPassword: z.string().min(8).max(128),
});

export const recoveryRedeemSchema = z.object({
  email: z.preprocess(emptyToUndefined, z.string().email().optional()),
  code: z.string().min(6),
  newPassword: z.string().min(8),
});

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  role: userRoleSchema,
  fullName: z.string().optional(),
  name: z.string().optional(),
  schoolName: z.string().optional().nullable(),
  schoolId: z.string().optional().nullable(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.string(),
});
