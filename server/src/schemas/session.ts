import { z } from 'zod';

export const utteranceItemSchema = z.object({
  speaker: z.enum(['user', 'ai']),
  startMs: z.number().int().nonnegative().nullable().optional(),
  endMs: z.number().int().nonnegative().nullable().optional(),
  text: z.string().min(1)
});

export const utteranceBatchSchema = z.object({
  items: z.array(utteranceItemSchema).min(1).max(100)
});
