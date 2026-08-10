import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

/**
 * Extra student profile fields, kept in a separate collection from User
 * rather than extending the User schema. One profile per user.
 * pictureUrl is a Cloudinary secure_url (packages/media), set via
 * POST /api/profile/picture — never a raw upload stored elsewhere.
 */
const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    nickname: { type: String, trim: true, default: null },
    // Free text, not an enum — schools label classes differently (SSS 2,
    // Grade 11, Form 4), so this is not constrained to a fixed list.
    className: { type: String, trim: true, default: null },
    gender: { type: String, trim: true, default: null },
    country: { type: String, trim: true, default: null },
    homeAddress: { type: String, trim: true, default: null },
    parentPhoneNumber: { type: String, trim: true, default: null },
    favoriteSubject: { type: String, trim: true, default: null },
    difficultSubject: { type: String, trim: true, default: null },
    futureAmbition: { type: String, trim: true, default: null },
    interestsHobby: { type: String, trim: true, default: null },
    pictureUrl: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

const Profile = models.Profile || model('Profile', profileSchema);
export default Profile;
