import bcrypt from 'bcryptjs';
import { env } from '@newton/config/src/env.js';
import {
  loginRequestSchema,
  studentSignupRequestSchema,
  refreshRequestSchema,
  recoveryRedeemSchema,
  resetPasswordRequestSchema,
  ROLES,
} from '@newton/types/src/user.js';
import { signAccessToken, signRefreshToken } from './jwt/signToken.js';
import { verifyRefreshToken } from './jwt/verifyToken.js';
import { authenticateUser } from './session/authenticateUser.js';
import {
  getRefreshTokenFromRequest,
  buildAuthSetCookieHeaders,
  clearAuthSetCookieHeaders,
  toPublicUser,
} from './session/session.js';
import { connect } from '@newton/database/src/connection.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import {
  issueRecoveryCode,
  redeemRecoveryCode,
  resetPasswordWithRecoveryCode,
} from './recovery-codes/generateRecoveryCode.js';
import { requireAuth } from './middleware.js';

function jsonResponse(body, status = 200, headers = new Headers()) {
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status, headers });
}

function validationError(parsed) {
  return jsonResponse(
    {
      ok: false,
      error: 'Validation failed',
      details: parsed.error.flatten(),
    },
    400
  );
}

function issueTokenPair(user) {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    email: user.email || undefined,
  });
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    typ: 'refresh',
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.NEWTON_JWT_ACCESS_EXPIRES,
  };
}

/**
 * POST /api/auth/signup — student self-registration.
 * Body: { fullName, password, schoolName, email?, phoneNumber? }
 * Returns tokens + one-time recoveryCode (show once; warn student to save it).
 */
export async function signupHandler(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = studentSignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const { fullName, password, schoolName, email, phoneNumber } = parsed.data;

  await connect();

  const existingName = await UserRepository.findByFullName(fullName);
  if (existingName) {
    return jsonResponse({ ok: false, error: 'An account with this full name already exists' }, 409);
  }

  if (email) {
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      return jsonResponse({ ok: false, error: 'An account with this email already exists' }, 409);
    }
  }

  if (phoneNumber) {
    const existingPhone = await UserRepository.findByPhoneNumber(phoneNumber);
    if (existingPhone) {
      return jsonResponse({ ok: false, error: 'An account with this phone number already exists' }, 409);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await UserRepository.create({
      fullName,
      name: fullName,
      ...(email ? { email } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      passwordHash,
      schoolName,
      role: ROLES.STUDENT,
      isActive: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      if (key === 'fullName') {
        return jsonResponse({ ok: false, error: 'An account with this full name already exists' }, 409);
      }
      if (key === 'email') {
        return jsonResponse({ ok: false, error: 'An account with this email already exists' }, 409);
      }
      if (key === 'phoneNumber') {
        return jsonResponse(
          { ok: false, error: 'An account with this phone number already exists' },
          409
        );
      }
      return jsonResponse({ ok: false, error: 'An account with these details already exists' }, 409);
    }
    throw error;
  }

  const { code: recoveryCode } = await issueRecoveryCode(user._id, { neverExpires: true });

  const tokens = issueTokenPair(user);
  const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);

  return jsonResponse(
    {
      ok: true,
      user: toPublicUser(user),
      recoveryCode,
      recoveryWarning:
        'Write this recovery code down and keep it safe. You will need it to reset your password. It will not be shown again.',
      ...tokens,
    },
    201,
    headers
  );
}

/**
 * POST /api/auth/login
 * Body: { fullName, password }
 */
export async function loginHandler(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const user = await authenticateUser(parsed.data);
  if (!user) {
    return jsonResponse({ ok: false, error: 'Invalid credentials' }, 401);
  }

  const tokens = issueTokenPair(user);
  const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);

  return jsonResponse(
    {
      ok: true,
      user: toPublicUser(user),
      ...tokens,
    },
    200,
    headers
  );
}

/**
 * POST /api/auth/refresh
 */
export async function refreshHandler(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = refreshRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const refreshToken = getRefreshTokenFromRequest(request, parsed.data.refreshToken);
  if (!refreshToken) {
    return jsonResponse({ ok: false, error: 'Missing refresh token' }, 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid refresh token' }, 401);
  }

  await connect();
  const user = await UserRepository.findById(payload.sub);
  if (!user || user.isActive === false) {
    return jsonResponse({ ok: false, error: 'User not found' }, 404);
  }

  const tokens = issueTokenPair(user);
  const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);

  return jsonResponse(
    {
      ok: true,
      user: toPublicUser(user),
      ...tokens,
    },
    200,
    headers
  );
}

/**
 * POST /api/auth/logout
 */
export async function logoutHandler() {
  const headers = clearAuthSetCookieHeaders();
  return jsonResponse({ ok: true }, 200, headers);
}

/**
 * GET /api/auth/me
 */
export async function meHandler(request) {
  let payload;
  try {
    payload = await requireAuth(request);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  await connect();
  const user = await UserRepository.findById(payload.sub);
  if (!user || user.isActive === false) {
    return jsonResponse({ ok: false, error: 'User not found' }, 404);
  }

  return jsonResponse({ ok: true, user: toPublicUser(user) });
}

/**
 * POST /api/auth/reset-password — students only.
 * Body: { code, newPassword }
 * Returns the same recoveryCode (not replaced).
 */
export async function resetPasswordHandler(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = resetPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const result = await resetPasswordWithRecoveryCode(parsed.data);
  if (!result) {
    return jsonResponse({ ok: false, error: 'Invalid recovery code' }, 401);
  }

  const tokens = issueTokenPair(result.user);
  const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);

  return jsonResponse(
    {
      ok: true,
      user: toPublicUser(result.user),
      recoveryCode: result.recoveryCode,
      recoveryWarning:
        'Your password was reset. This is the same recovery code — keep it written down somewhere safe. You will need it again if you forget your password.',
      ...tokens,
    },
    200,
    headers
  );
}

/**
 * POST /api/auth/recovery — legacy alias; prefers reset-password for students.
 */
export async function recoveryHandler(request) {
  const body = await request.json().catch(() => ({}));

  // If no email, treat as student code-only reset.
  if (!body.email) {
    const parsed = resetPasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed);
    }
    const result = await resetPasswordWithRecoveryCode(parsed.data);
    if (!result) {
      return jsonResponse({ ok: false, error: 'Invalid recovery code' }, 401);
    }
    const tokens = issueTokenPair(result.user);
    const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);
    return jsonResponse(
      {
        ok: true,
        user: toPublicUser(result.user),
        recoveryCode: result.recoveryCode,
        ...tokens,
      },
      200,
      headers
    );
  }

  const parsed = recoveryRedeemSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed);
  }

  const user = await redeemRecoveryCode(parsed.data);
  if (!user) {
    return jsonResponse({ ok: false, error: 'Invalid recovery code or email' }, 401);
  }

  const tokens = issueTokenPair(user);
  const headers = buildAuthSetCookieHeaders(tokens.accessToken, tokens.refreshToken);

  return jsonResponse(
    {
      ok: true,
      user: toPublicUser(user),
      ...tokens,
    },
    200,
    headers
  );
}
