import Flashcard from '../models/Flashcard.js';

export const FlashcardRepository = {
  /** All of a user's flashcards, newest first — powers the flashcard viewer and the profile page's per-topic sections. */
  async findAllForUser(userId) {
    if (!userId) return [];
    return Flashcard.find({ userId: String(userId) }).sort({ createdAt: -1 }).exec();
  },

  async findDueForUser(userId, limit = 5) {
    if (!userId) return [];
    return Flashcard.find({ userId: String(userId) })
      .sort({ dueAt: 1 })
      .limit(limit)
      .exec();
  },

  async findBookmarkedDueForUser(userId, limit = 5) {
    if (!userId) return [];
    return Flashcard.find({ userId: String(userId), bookmarked: true })
      .sort({ dueAt: 1 })
      .limit(limit)
      .exec();
  },

  async create(data) {
    const flashcard = new Flashcard(data);
    return flashcard.save();
  },

  async incrementSeenCount(id) {
    return Flashcard.findByIdAndUpdate(String(id), { $inc: { seenCount: 1 } }, { new: true }).exec();
  },

  async deleteAllForUser(userId) {
    return Flashcard.deleteMany({ userId: String(userId) }).exec();
  },
};

export default FlashcardRepository;
