import { z } from 'zod';

const text = (max) => z.string().trim().max(max);
const optionalText = (max) => text(max).optional();
const optionalNumber = (min, max) => z.union([z.number(), z.string().trim().max(20), z.null()]).transform(v => v === '' || v === null ? null : Number(v)).refine(v => v === null || (Number.isSafeInteger(v) && v >= min && v <= max), 'Enter a valid whole number.').optional();
const requiredAge = z.union([z.number(), z.string().trim().min(1).max(3)]).transform(Number).refine(v => Number.isInteger(v) && v >= 0 && v <= 120, 'Age must be between 0 and 120.');
const profileFields = {
  name: text(100).min(1, 'Name is required.'),
  age: requiredAge,
  state: text(100).min(1, 'State is required.'),
  gender: z.enum(['', 'Female', 'Male', 'Other', 'Prefer not to say']).optional(),
  district: optionalText(100),
  occupation: optionalText(100),
  income: optionalNumber(0, 999999999),
  language: z.enum(['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Other']).optional(),
  familySize: optionalNumber(1, 100),
  residence: z.enum(['', 'Rural', 'Urban']).optional(),
  category: z.enum(['', 'Not sure', 'BPL household', 'SC', 'ST', 'Other']).optional(),
};
const mobile = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.');
// bcrypt only uses the first 72 bytes; reject longer passwords explicitly.
const password = z.string().min(12, 'Password must be at least 12 characters.').refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes.');
export const registerSchema = z.object({ mobile, password, profile: z.object(profileFields).strict() }).strict();
// Keep login responses generic, including for password lengths that cannot be valid.
export const loginSchema = z.object({ mobile, password: z.string().min(1).max(256) }).strict();
export const updateProfileSchema = z.object(profileFields).partial().strict().refine(v => Object.keys(v).length > 0, 'Provide at least one profile field.');
