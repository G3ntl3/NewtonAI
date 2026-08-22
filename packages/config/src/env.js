import './dotenv-loader.js';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEWTON_MONGODB_URI: z.string().min(1, 'NEWTON_MONGODB_URI is required'),

  NEWTON_JWT_SECRET: z.string().min(32, 'NEWTON_JWT_SECRET must be at least 32 characters'),
  NEWTON_JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'NEWTON_JWT_REFRESH_SECRET must be at least 32 characters')
    .optional(),
  NEWTON_JWT_ACCESS_EXPIRES: z.string().default('15m'),
  NEWTON_JWT_REFRESH_EXPIRES: z.string().default('7d'),
  NEWTON_AUTH_COOKIE_DOMAIN: z.string().optional(),

  NEWTON_DEMO_EMAIL: z.string().email().optional(),
  NEWTON_DEMO_PASSWORD: z.string().optional(),

  /** Shown on student reset-password when they cannot access their recovery code */
  NEWTON_SUPPORT_PHONE: z.string().default('+234 800 111 2233'),
  NEWTON_SUPPORT_EMAIL: z.string().email().optional(),

  // Read directly from process.env in GeminiProvider.js (the only file allowed
  // to import Gemini) — declared here too so `npm run` scripts and other env
  // consumers get the same shape/documentation. Optional: routes unrelated to
  // chat must keep booting even when a Gemini key hasn't been provisioned yet.
  NEWTON_GEMINI_API_KEY: z.string().optional(),
  NEWTON_GEMINI_MODEL: z.string().default('gemini-3-flash'),

  // Tutoring-style A/B switch, read in PromptBuilder.js. 'current' is the
  // per-turn assembled prompt; 'legacy' is the older short, phase-based
  // style. Defaults to 'current', so an unset var changes nothing.
  NEWTON_PROMPT_VARIANT: z.enum(['current', 'legacy']).default('current'),

  // Profile picture uploads (packages/media). Optional: routes unrelated to
  // profile pictures must keep booting even before these are provisioned.
  NEWTON_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEWTON_CLOUDINARY_API_KEY: z.string().optional(),
  NEWTON_CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

/** @type {typeof parsed & { NEWTON_JWT_REFRESH_SECRET: string }} */
export const env = {
  ...parsed,
  NEWTON_JWT_REFRESH_SECRET: parsed.NEWTON_JWT_REFRESH_SECRET || parsed.NEWTON_JWT_SECRET,
};

export default env;
