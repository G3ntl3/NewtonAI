/**
 * generate-recovery-codes.js
 * Issue a recovery code for a user by email.
 *
 * Usage:
 *   node scripts/generate-recovery-codes.js student@newton.ai
 */
import { connect } from '../packages/database/src/connection.js';
import { UserRepository } from '../packages/database/src/repositories/UserRepository.js';
import { issueRecoveryCode } from '../packages/auth/src/recovery-codes/generateRecoveryCode.js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/generate-recovery-codes.js <email>');
    process.exit(1);
  }

  await connect();
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const { code, expiresAt } = await issueRecoveryCode(user._id, { ttlDays: 30 });
  console.log(`Recovery code for ${user.email} (${user.role}):`);
  console.log(`  code: ${code}`);
  console.log(`  expires: ${expiresAt.toISOString()}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
