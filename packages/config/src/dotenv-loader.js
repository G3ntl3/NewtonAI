import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Walk up from cwd to find the monorepo-root `.env`.
 * Next.js apps run with cwd = apps/<name>, so a single-level lookup fails.
 */
function findEnvFile(startDir = process.cwd()) {
  let dir = startDir;

  for (;;) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

const envPath = findEnvFile();
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}
