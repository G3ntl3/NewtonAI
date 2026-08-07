import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    curriculumId: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const School = models.School || model('School', schoolSchema);
export default School;
