import { Queue } from 'bullmq';
import { env } from '../env.js';

export const connection = {
  url: env.REDIS_URL
};

export const sessionQueue = new Queue('session-processing', { connection });
