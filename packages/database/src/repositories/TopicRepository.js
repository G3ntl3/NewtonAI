import Topic from '../models/Topic.js';

export const TopicRepository = {
  async countAll() {
    return Topic.countDocuments().exec();
  },

  /** Topic count per subject, keyed by subjectId string, for the Subjects tiles. */
  async countsBySubject() {
    const rows = await Topic.aggregate([{ $group: { _id: '$subjectId', count: { $sum: 1 } } }]);
    return Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  },

  async listBySubject(subjectId) {
    if (!subjectId) return [];
    return Topic.find({ subjectId: String(subjectId) }).sort({ order: 1 }).exec();
  },

  async create(data) {
    const topic = new Topic(data);
    return topic.save();
  },

  async upsertByName(subjectId, name, data) {
    return Topic.findOneAndUpdate(
      { subjectId: String(subjectId), name: String(name).trim() },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default TopicRepository;
