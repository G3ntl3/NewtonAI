import Profile from '../models/Profile.js';

export const ProfileRepository = {
  async findByUserId(userId) {
    if (!userId) return null;
    return Profile.findOne({ userId: String(userId) }).exec();
  },

  async upsertByUserId(userId, patch) {
    return Profile.findOneAndUpdate(
      { userId: String(userId) },
      { $set: patch },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default ProfileRepository;
