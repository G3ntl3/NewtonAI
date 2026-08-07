import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const flashcardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', default: null },
    question: { type: String, required: true, trim: true },
    answer: { type: String, trim: true, default: '' },
    seenCount: { type: Number, default: 0, min: 0 },
    dueAt: { type: Date, default: null },
    /** Powers the dashboard's "Bookmarks" mini-tile (bookmarked due flashcards) */
    bookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

flashcardSchema.index({ userId: 1, dueAt: 1 });

const Flashcard = models.Flashcard || model('Flashcard', flashcardSchema);
export default Flashcard;
