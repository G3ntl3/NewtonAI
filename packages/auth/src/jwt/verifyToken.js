import jwt from 'jsonwebtoken';
import { env } from '@newton/config/src/env.js';

export function verifyAccessToken(token) {
  return jwt.verify(token, env.NEWTON_JWT_SECRET, { algorithms: ['HS256'] });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.NEWTON_JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
}
