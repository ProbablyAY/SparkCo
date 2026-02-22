import { z } from 'zod';

export const curatorOutputSchema = z.object({
  title: z.string(),
  curated_entry_md: z.string(),
  summary_bullets: z.array(z.string()),
  themes: z.array(z.string()).min(3).max(8),
  emotional_timeline: z.array(
    z.object({ t: z.enum(['start', 'mid', 'end']), label: z.string(), evidence: z.string() })
  ),
  key_moments: z.array(
    z.object({ timestamp_ms: z.number(), moment: z.string(), why_it_matters: z.string() })
  ),
  followup_questions: z.array(z.string()),
  memory_candidates: z.array(
    z.object({
      category: z.enum(['preference', 'goal', 'relationship', 'project', 'value', 'other']),
      text: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

export type CuratorOutput = z.infer<typeof curatorOutputSchema>;
