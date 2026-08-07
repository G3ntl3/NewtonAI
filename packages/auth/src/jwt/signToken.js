import jwt from 'jsonwebtoken';
import { env } from '@newton/config/src/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.NEWTON_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.NEWTON_JWT_ACCESS_EXPIRES,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.NEWTON_JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.NEWTON_JWT_REFRESH_EXPIRES,
  });
}
