import Subject from '../models/Subject.js';

export const SubjectRepository = {
  async listAll() {
    return Subject.find().sort({ order: 1, name: 1 }).exec();
  },

  async findBySlug(slug) {
    if (!slug) return null;
    return Subject.findOne({ slug: String(slug).trim().toLowerCase() }).exec();
  },

  async create(data) {
    const subject = new Subject(data);
    return subject.save();
  },

  async upsertBySlug(slug, data) {
    return Subject.findOneAndUpdate(
      { slug: String(slug).trim().toLowerCase() },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default SubjectRepository;
