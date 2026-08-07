export { signAccessToken, signRefreshToken } from './jwt/signToken.js';
export { verifyAccessToken, verifyRefreshToken } from './jwt/verifyToken.js';
export {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  buildAuthSetCookieHeaders,
  clearAuthSetCookieHeaders,
  toPublicUser,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from './session/session.js';
export { authenticateUser } from './session/authenticateUser.js';
export { requireStudent } from './session.js';
export { ROLES, hasRole, hasAtLeastRole } from './rbac/roles.js';
export { requireAuth, requireRole, default as authMiddleware } from './middleware.js';
export {
  signupHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  recoveryHandler,
  resetPasswordHandler,
} from './handlers.js';
export {
  generatePlainRecoveryCode,
  hashRecoveryCode,
  normalizeRecoveryCode,
  recoveryCodeLookupKey,
  issueRecoveryCode,
  redeemRecoveryCode,
  resetPasswordWithRecoveryCode,
} from './recovery-codes/generateRecoveryCode.js';
