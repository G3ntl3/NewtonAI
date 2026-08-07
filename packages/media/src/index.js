/**
 * @newton/media
 *
 * Cloudinary abstraction — the only file allowed to import the Cloudinary
 * SDK, mirroring how packages/ai isolates Gemini. Upload only; profile
 * pictures are the sole caller today.
 */
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@newton/config/src/env.js';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!env.NEWTON_CLOUDINARY_CLOUD_NAME || !env.NEWTON_CLOUDINARY_API_KEY || !env.NEWTON_CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary env vars are not set (NEWTON_CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
  }
  cloudinary.config({
    cloud_name: env.NEWTON_CLOUDINARY_CLOUD_NAME,
    api_key: env.NEWTON_CLOUDINARY_API_KEY,
    api_secret: env.NEWTON_CLOUDINARY_API_SECRET,
  });
  configured = true;
}

/**
 * Uploads a profile picture and returns its secure URL.
 * @param {Buffer} fileBuffer
 * @param {string} userId - used to build a stable public_id so re-uploads overwrite, not accumulate
 * @returns {Promise<string>} secure_url
 */
export async function uploadProfilePicture(fileBuffer, userId) {
  ensureConfigured();
  const base64 = fileBuffer.toString('base64');
  const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
    folder: 'newton-ai/profile-pictures',
    public_id: String(userId),
    overwrite: true,
    resource_type: 'image',
  });
  return result.secure_url;
}

export default { uploadProfilePicture };
