import StudySession from '../models/StudySession.js';

export const StudySessionRepository = {
  /** Sessions from `since` (inclusive) to now, newest first — used for streak + weekly chart. */
  async findSinceForUser(userId, since) {
    if (!userId) return [];
    return StudySession.find({ userId: String(userId), date: { $gte: since } })
      .sort({ date: -1 })
      .exec();
  },

  /** Adds minutes to the given calendar day's session, creating it if needed. */
  async addMinutes(userId, date, minutes, subjectId = null) {
    return StudySession.findOneAndUpdate(
      { userId: String(userId), date },
      { $inc: { minutesStudied: minutes }, $setOnInsert: { subjectId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },

  async deleteAllForUser(userId) {
    return StudySession.deleteMany({ userId: String(userId) }).exec();
  },
};

export default StudySessionRepository;
