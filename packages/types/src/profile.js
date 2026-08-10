import { z } from 'zod';

const emptyToNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const optionalText = (max) => z.preprocess(emptyToNull, z.string().max(max).nullable());

/** PUT /api/profile body — every field optional, full name is NOT included (see profile page). */
export const profileUpdateSchema = z.object({
  nickname: optionalText(60),
  className: optionalText(40),
  gender: optionalText(30),
  country: optionalText(60),
  homeAddress: optionalText(200),
  parentPhoneNumber: optionalText(20),
  favoriteSubject: optionalText(60),
  difficultSubject: optionalText(60),
  futureAmbition: optionalText(120),
  interestsHobby: optionalText(120),
});
