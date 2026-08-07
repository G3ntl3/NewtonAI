import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * One-time recovery codes for password reset.
 * Plain codes are never stored — only hash + lookup key.
 */
const recoveryCodeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codeHash: { type: String, required: true },
    /** SHA-256 of normalized code for indexed lookup (email may be absent). */
    codeLookup: { type: String, required: true, unique: true, index: true },
    /** null = never expires (student signup codes). */
    expiresAt: { type: Date, default: null },
    usedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

recoveryCodeSchema.index({ userId: 1, usedAt: 1 });

const RecoveryCode = models.RecoveryCode || model('RecoveryCode', recoveryCodeSchema);
export default RecoveryCode;
