import User from '../models/User.js';
import { watDateKey, nextStreakState } from '../streak.js';

function normalizePhone(phone) {
  if (!phone) return undefined;
  const normalized = String(phone).replace(/[\s()-]/g, '').trim();
  return normalized || undefined;
}

/**
 * Build a create/update payload that omits empty optional unique fields.
 * Storing `email: null` breaks unique indexes that are not partial/sparse.
 */
function sanitizeOptionalUniques(data) {
  const payload = { ...data };

  if (payload.email) {
    payload.email = String(payload.email).trim().toLowerCase();
  } else {
    delete payload.email;
  }

  if (payload.phoneNumber) {
    payload.phoneNumber = normalizePhone(payload.phoneNumber);
    if (!payload.phoneNumber) {
      delete payload.phoneNumber;
    }
  } else {
    delete payload.phoneNumber;
  }

  if (payload.fullName && !payload.name) {
    payload.name = payload.fullName;
  }

  return payload;
}

export const UserRepository = {
  async findByEmail(email) {
    if (!email) {
      return null;
    }
    return User.findOne({ email: String(email).trim().toLowerCase() }).exec();
  },

  async findByPhoneNumber(phoneNumber) {
    const normalized = normalizePhone(phoneNumber);
    if (!normalized) {
      return null;
    }
    return User.findOne({ phoneNumber: normalized }).exec();
  },

  /** Case-insensitive exact match — login identifier for student-web. */
  async findByFullName(fullName) {
    const trimmed = String(fullName || '').trim();
    if (!trimmed) {
      return null;
    }
    return User.findOne({ fullName: trimmed })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  },

  async findByEmailOrPhone({ email, phoneNumber }) {
    if (email) {
      const byEmail = await this.findByEmail(email);
      if (byEmail) return byEmail;
    }
    if (phoneNumber) {
      return this.findByPhoneNumber(phoneNumber);
    }
    return null;
  },

  async findById(id) {
    if (!id) {
      return null;
    }
    return User.findById(String(id)).exec();
  },

  async create(data) {
    const payload = sanitizeOptionalUniques(data);
    const user = new User(payload);
    return user.save();
  },

  async update(id, data) {
    const payload = sanitizeOptionalUniques(data);
    return User.findByIdAndUpdate(String(id), payload, { new: true }).exec();
  },

  async upsertByEmail(email, data) {
    const payload = sanitizeOptionalUniques({
      ...data,
      email: String(email).trim().toLowerCase(),
    });
    return User.findOneAndUpdate(
      { email: payload.email },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  /**
   * Record that this student was active today and roll their streak forward.
   * Rules live in ../streak.js (pure); this only reads state, applies them,
   * and writes back when something actually changed — a second message the
   * same day is a no-op with no write.
   *
   * @param {string} id
   * @param {Date} [now] injectable for tests; defaults to the real clock
   * @returns {Promise<{currentStreak: number, longestStreak: number, lastActiveDate: string}|null>}
   */
  async recordDailyActivity(id, now = new Date()) {
    if (!id) return null;

    const user = await User.findById(String(id))
      .select('currentStreak longestStreak lastActiveDate')
      .exec();
    if (!user) return null;

    const todayKey = watDateKey(now);
    const next = nextStreakState(user, todayKey);

    if (!next.changed) {
      return {
        currentStreak: user.currentStreak ?? 0,
        longestStreak: user.longestStreak ?? 0,
        lastActiveDate: user.lastActiveDate ?? null,
      };
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          currentStreak: next.currentStreak,
          longestStreak: next.longestStreak,
          lastActiveDate: next.lastActiveDate,
        },
      }
    ).exec();

    return {
      currentStreak: next.currentStreak,
      longestStreak: next.longestStreak,
      lastActiveDate: next.lastActiveDate,
    };
  },
};

export default UserRepository;
