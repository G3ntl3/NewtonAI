import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const topicSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    name: { type: String, required: true, trim: true },
    /** Class/grade level, e.g. "SSS 2" — shown on the resume-lesson card */
    level: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.index({ subjectId: 1, order: 1 });

const Topic = models.Topic || model('Topic', topicSchema);
export default Topic;
