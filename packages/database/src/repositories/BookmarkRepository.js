import Bookmark from '../models/Bookmark.js';

export const BookmarkRepository = {
  async findRecentForUser(userId, limit = 10) {
    if (!userId) return [];
    return Bookmark.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  },

  async create(data) {
    const bookmark = new Bookmark(data);
    return bookmark.save();
  },

  async deleteForUser(id, userId) {
    return Bookmark.findOneAndDelete({ _id: String(id), userId: String(userId) }).exec();
  },

  async deleteAllForUser(userId) {
    return Bookmark.deleteMany({ userId: String(userId) }).exec();
  },
};

export default BookmarkRepository;
