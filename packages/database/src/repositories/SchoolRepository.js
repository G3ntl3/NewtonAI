import School from '../models/School.js';

export const SchoolRepository = {
  async findById(id) {
    if (!id) {
      return null;
    }
    return School.findById(String(id)).exec();
  },

  async create(data) {
    const school = new School(data);
    return school.save();
  },

  async upsertByName(name, data) {
    return School.findOneAndUpdate(
      { name: String(name).trim() },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export default SchoolRepository;
