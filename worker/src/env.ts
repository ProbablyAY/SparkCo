import { config } from 'dotenv';
import { z } from 'zod';

config();

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_CURATOR_MODEL: z.string().min(1)
});

export const env = schema.parse(process.env);
