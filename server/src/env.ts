import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_REALTIME_MODEL: z.string().min(1),
  OPENAI_CURATOR_MODEL: z.string().min(1)
});

export const env = envSchema.parse(process.env);
