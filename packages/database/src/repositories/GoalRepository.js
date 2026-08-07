import Goal from '../models/Goal.js';

export const GoalRepository = {
  async findActiveForUser(userId, limit = 10) {
    if (!userId) return [];
    // status: -1 → 'in_progress' sorts before 'done' (lexicographically descending)
    return Goal.find({ userId: String(userId) })
      .sort({ status: -1, dueAt: 1, createdAt: -1 })
      .limit(limit)
      .exec();
  },

  async create(data) {
    const goal = new Goal(data);
    return goal.save();
  },

  async update(id, data) {
    return Goal.findByIdAndUpdate(String(id), data, { new: true }).exec();
  },

  async deleteAllForUser(userId) {
    return Goal.deleteMany({ userId: String(userId) }).exec();
  },
};

export default GoalRepository;
