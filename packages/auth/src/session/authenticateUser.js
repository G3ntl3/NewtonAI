import bcrypt from 'bcryptjs';
import { connect } from '@newton/database/src/connection.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';

export async function authenticateUser({ fullName, password }) {
  if (!fullName || !password) {
    return null;
  }

  await connect();
  const user = await UserRepository.findByFullName(fullName);
  if (!user || user.isActive === false) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}
