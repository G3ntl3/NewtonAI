import Analytics from '../models/Analytics.js';

export const AnalyticsRepository = {
  async findByUser(userId) {
    if (!userId) return null;
    return Analytics.findOne({ userId: String(userId) }).exec();
  },

  async upsertForUser(userId, data) {
    return Analytics.findOneAndUpdate(
      { userId: String(userId) },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default AnalyticsRepository;
