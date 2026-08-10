import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const userSchema = new Schema(
  {
    /** Exactly three names, e.g. "Ada King Lovelace" */
    fullName: { type: String, required: true, trim: true },
    /** Legacy alias kept in sync with fullName for older callers */
    name: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: 'student',
      enum: ['student', 'teacher', 'parent', 'school_admin', 'super_admin'],
    },
    schoolName: { type: String, trim: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', default: null },
    isActive: { type: Boolean, default: true },

    // --- Daily activity streak (see ../streak.js for the rules) -----------
    // Student-level, spanning every subject — deliberately NOT on Session,
    // which is per (student, subject). Nothing here touches the reveal
    // ladder; this is activity tracking only.
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    // Date-only 'YYYY-MM-DD' in WAT, stored as a String rather than a Date on
    // purpose: a Date is always a timestamp, which reintroduces the
    // time-of-day ambiguity that makes day comparisons fragile.
    lastActiveDate: { type: String, default: null },
  },
  { timestamps: true }
);

// fullName is the login identifier — unique, case-insensitive (collation strength 2).
userSchema.index(
  { fullName: 1 },
  {
    unique: true,
    name: 'fullName_unique_ci',
    collation: { locale: 'en', strength: 2 },
  }
);

// Unique only when the field is actually a string — many students may omit email/phone.
userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: 'email_unique_partial',
    partialFilterExpression: { email: { $type: 'string' } },
  }
);

userSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    name: 'phoneNumber_unique_partial',
    partialFilterExpression: { phoneNumber: { $type: 'string' } },
  }
);

/**
 * Drop legacy unique indexes that treat missing email/phone as null duplicates.
 * Safe to call on every boot.
 */
export async function ensureUserIndexes() {
  const collection = mongoose.connection.collection('users');
  const indexes = await collection.indexes();
  const dropNames = ['email_1', 'phoneNumber_1'];

  for (const index of indexes) {
    if (dropNames.includes(index.name)) {
      await collection.dropIndex(index.name);
    }
  }

  await model('User').syncIndexes();
}

const User = models.User || model('User', userSchema);
export default User;
