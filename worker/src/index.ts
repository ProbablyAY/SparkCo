import { Worker } from 'bullmq';
import { env } from './env.js';
import { processSession } from './jobs/processSession.js';

const worker = new Worker(
  'session-processing',
  async (job) => {
    if (job.name === 'process_session') {
      await processSession(job.data.sessionId as string);
    }
  },
  { connection: { url: env.REDIS_URL } }
);

worker.on('completed', (job) => console.log(`[worker] completed job ${job.id}`));
worker.on('failed', (job, error) => console.error(`[worker] failed job ${job?.id}`, error));

console.log('[worker] started');
