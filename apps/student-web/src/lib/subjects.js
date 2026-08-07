/**
 * Client-safe mirror of the subject enum (packages/database/src/models/Session.js
 * SUBJECTS — not imported directly since that file pulls in Mongoose, which
 * can't run in the browser). Keep in sync with that enum and CLAUDE.md
 * "Session & concept model".
 */
export const SUBJECTS = [
  { id: 'physics', label: 'Physics', icon: 'zap' },
  { id: 'chemistry', label: 'Chemistry', icon: 'flask-conical' },
  { id: 'biology', label: 'Biology', icon: 'dna' },
  { id: 'maths', label: 'Maths', icon: 'calculator' },
];
