import { z } from 'zod';
export const messageSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  language: z.enum(['English','Hindi']),
  context: z.array(z.string().trim().min(1).max(1200)).max(4).default([]),
  consentExternal: z.boolean().default(false),
  saveHistory: z.boolean().default(false),
}).strict();
