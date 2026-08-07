import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * One row per student per calendar day of study activity. `date` is
 * normalized to UTC midnight so a day's minutes can be accumulated with a
 * single upsert regardless of how many sessions happened that day. Backs
 * the streak counter and the weekly bar chart on the dashboard.
 */
const studySessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    minutesStudied: { type: Number, required: true, min: 0, default: 0 },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', default: null },
  },
  { timestamps: true }
);

studySessionSchema.index({ userId: 1, date: 1 }, { unique: true });

const StudySession = models.StudySession || model('StudySession', studySessionSchema);
export default StudySession;
