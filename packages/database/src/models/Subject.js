import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    /** lucide-react icon key rendered on the subject tile (see SUBJECT_ICON_MAP) */
    icon: { type: String, default: 'book' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Subject = models.Subject || model('Subject', subjectSchema);
export default Subject;
