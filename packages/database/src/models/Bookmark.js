import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const bookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', default: null },
    sourceType: { type: String, enum: ['chat', 'lesson', 'flashcard'], default: 'chat' },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, createdAt: -1 });

const Bookmark = models.Bookmark || model('Bookmark', bookmarkSchema);
export default Bookmark;
