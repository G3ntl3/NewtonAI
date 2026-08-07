import User from '../models/User.js';

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
};

export default UserRepository;
