import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Per-student, per-topic mastery. `subjectId` is denormalized from the
 * topic so subject-level rollups (e.g. "7 of 12 topics") don't need a join.
 */
const masterySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    masteryPercent: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    lastStudiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

masterySchema.index({ userId: 1, topicId: 1 }, { unique: true });
masterySchema.index({ userId: 1, subjectId: 1 });

const Mastery = models.Mastery || model('Mastery', masterySchema);
export default Mastery;
