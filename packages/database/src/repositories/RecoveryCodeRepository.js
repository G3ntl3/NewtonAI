import RecoveryCode from '../models/RecoveryCode.js';

export const RecoveryCodeRepository = {
  async create({ userId, codeHash, codeLookup, expiresAt = null, createdBy = null }) {
    const doc = new RecoveryCode({ userId, codeHash, codeLookup, expiresAt, createdBy });
    return doc.save();
  },

  async findActiveByLookup(codeLookup) {
    const doc = await RecoveryCode.findOne({
      codeLookup,
      usedAt: null,
    }).exec();

    if (!doc) {
      return null;
    }

    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return doc;
  },

  async findActiveByUserId(userId) {
    return RecoveryCode.find({
      userId: String(userId),
      usedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .sort({ createdAt: -1 })
      .exec();
  },

  async markUsed(id) {
    return RecoveryCode.findByIdAndUpdate(String(id), { usedAt: new Date() }, { new: true }).exec();
  },

  async deleteUnusedForUser(userId) {
    return RecoveryCode.deleteMany({
      userId: String(userId),
      usedAt: null,
    }).exec();
  },
};

export default RecoveryCodeRepository;
