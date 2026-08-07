/**
 * ping-db.js
 * Standalone connectivity check — connects to MongoDB and pings it.
 * Nothing else: no models, no seeding, no app code involved.
 *
 * Usage (from repo root):
 *   node scripts/ping-db.js
 */
import mongoose from 'mongoose';
import { connect } from '../packages/database/src/connection.js';

async function main() {
  await connect();
  const result = await mongoose.connection.db.admin().command({ ping: 1 });
  console.log('Ping OK:', result);
  process.exit(0);
}

main().catch((err) => {
  console.error('Ping failed:', err);
  process.exit(1);
});
