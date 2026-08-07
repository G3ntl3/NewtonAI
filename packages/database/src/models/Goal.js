import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const goalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    targetCount: { type: Number, required: true, min: 1 },
    currentCount: { type: Number, default: 0, min: 0 },
    /** Optional target date, rendered as e.g. "Fri" on the dashboard */
    dueAt: { type: Date, default: null },
    status: { type: String, enum: ['in_progress', 'done'], default: 'in_progress' },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, status: 1 });

const Goal = models.Goal || model('Goal', goalSchema);
export default Goal;
