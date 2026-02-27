import { describe, expect, it } from 'vitest';
import { curatorOutputSchema } from '../src/jobs/curatorSchema.js';

describe('curator schema', () => {
  it('validates strict payload', () => {
    const parsed = curatorOutputSchema.parse({
      title: 'A reflective check-in',
      curated_entry_md: 'Today was good.',
      summary_bullets: ['a', 'b'],
      themes: ['focus', 'family', 'energy'],
      emotional_timeline: [
        { t: 'start', label: 'tense', evidence: 'meeting stress' },
        { t: 'mid', label: 'calmer', evidence: 'walk break' },
        { t: 'end', label: 'hopeful', evidence: 'planned tomorrow' }
      ],
      key_moments: [{ timestamp_ms: 12000, moment: 'Call ended', why_it_matters: 'freed attention' }],
      followup_questions: ['What felt best today?'],
      memory_candidates: [{ category: 'goal', text: 'Run 3 times weekly', confidence: 0.8 }]
    });
    expect(parsed.title).toBeTruthy();
  });
});
