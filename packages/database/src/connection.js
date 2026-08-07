import mongoose from 'mongoose';
import { env } from '@newton/config/src/env.js';
import { ensureUserIndexes } from './models/User.js';

let cached = null;
let indexesReady = false;

export async function connect() {
  if (cached) {
    if (!indexesReady) {
      await ensureUserIndexes();
      indexesReady = true;
    }
    return cached;
  }

  if (!env.NEWTON_MONGODB_URI) {
    throw new Error('Missing NEWTON_MONGODB_URI in environment configuration');
  }

  mongoose.set('strictQuery', false);
  cached = await mongoose.connect(env.NEWTON_MONGODB_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });

  await ensureUserIndexes();
  indexesReady = true;

  return cached;
}

export default connect;
