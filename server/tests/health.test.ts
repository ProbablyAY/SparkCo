import { beforeAll, describe, expect, it } from 'vitest';

let buildApp: typeof import('../src/app.js').buildApp;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/aijournal';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'changeme123';
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-key';
  process.env.OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-4o-realtime-preview';
  process.env.OPENAI_CURATOR_MODEL = process.env.OPENAI_CURATOR_MODEL ?? 'gpt-4.1-mini';
  process.env.NODE_ENV = 'test';

  ({ buildApp } = await import('../src/app.js'));
});

describe('health endpoint', () => {
  it('returns ok', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    await app.close();
  });
});
