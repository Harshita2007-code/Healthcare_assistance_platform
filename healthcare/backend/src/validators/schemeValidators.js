import { z } from 'zod';
export const schemeSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  category: z.enum(['', 'Health cover', 'Maternal health', 'Child health']).optional(),
  beneficiary: z.enum(['', 'Families', 'Pregnant women', 'Children']).optional(),
}).strict();
export const slugSchema = z.string().regex(/^[a-z0-9-]{1,60}$/);
