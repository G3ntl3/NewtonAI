import mongoose from 'mongoose';
import Mastery from '../models/Mastery.js';

export const MasteryRepository = {
  async findByUser(userId) {
    if (!userId) return [];
    return Mastery.find({ userId: String(userId) }).exec();
  },

  async countCompletedForUser(userId) {
    if (!userId) return 0;
    return Mastery.countDocuments({ userId: String(userId), completed: true }).exec();
  },

  /** Completed-topic count per subject, for the Subjects section tiles. */
  async completedCountsBySubjectForUser(userId) {
    if (!userId) return {};
    const rows = await Mastery.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(String(userId)), completed: true } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  },

  /** Most recently studied, not-yet-completed topic — powers "Pick up where you stopped". */
  async findMostRecentInProgressForUser(userId) {
    if (!userId) return null;
    return Mastery.findOne({ userId: String(userId), completed: false, lastStudiedAt: { $ne: null } })
      .sort({ lastStudiedAt: -1 })
      .populate('topicId')
      .populate('subjectId')
      .exec();
  },

  async upsert(userId, topicId, data) {
    return Mastery.findOneAndUpdate(
      { userId: String(userId), topicId: String(topicId) },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default MasteryRepository;
