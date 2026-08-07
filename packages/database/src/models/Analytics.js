import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Per-student rollup for the dashboard Insights tile. Values here are
 * counters maintained by the features that produce them (quiz engine, chat,
 * simulations) — this model does not derive them itself. `*Delta` is the
 * change since the previous period, shown as the small "+N" badge.
 */
const analyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    quizAccuracy: { type: Number, default: 0, min: 0, max: 100 },
    quizAccuracyDelta: { type: Number, default: 0 },
    questionsAsked: { type: Number, default: 0, min: 0 },
    questionsAskedDelta: { type: Number, default: 0 },
    practicalsRun: { type: Number, default: 0, min: 0 },
    practicalsRunDelta: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Analytics = models.Analytics || model('Analytics', analyticsSchema);
export default Analytics;
