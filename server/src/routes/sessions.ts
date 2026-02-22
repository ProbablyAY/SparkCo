import type { FastifyPluginAsync } from 'fastify';
import { AIRequestKind, AIRequestStatus, SessionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { utteranceBatchSchema } from '../schemas/session.js';
import { sessionQueue } from '../services/queue.js';

const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/sessions', async (request) => {
    const session = await prisma.journalSession.create({
      data: {
        userId: request.user.userId,
        startedAt: new Date(),
        status: SessionStatus.live
      }
    });

    return { session };
  });

  fastify.get('/sessions', async (request) => {
    const sessions = await prisma.journalSession.findMany({
      where: { userId: request.user.userId },
      orderBy: { startedAt: 'desc' }
    });
    return { sessions };
  });

  fastify.get('/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = await prisma.journalSession.findFirst({
      where: { id, userId: request.user.userId },
      include: {
        utterances: { orderBy: { createdAt: 'asc' } },
        artifact: true,
        memoryCandidates: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!session) return reply.notFound('Session not found');
    return { session };
  });

  fastify.post('/sessions/:id/realtime-token', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = await prisma.journalSession.findFirst({ where: { id, userId: request.user.userId } });
    if (!session) return reply.notFound('Session not found');
    if (session.status !== SessionStatus.live) return reply.badRequest('Session is not live');

    const start = Date.now();
    try {
      const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fastify.config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: fastify.config.OPENAI_REALTIME_MODEL,
          voice: 'alloy',
          instructions:
            'You are a friendly, curious journaling companion. One question at a time, concise, reflective, not clinical, no therapy framing.'
        })
      });
      const payload = await res.json();
      if (!res.ok) {
        await prisma.aIRequestLog.create({
          data: {
            sessionId: id,
            kind: AIRequestKind.realtime,
            model: fastify.config.OPENAI_REALTIME_MODEL,
            latencyMs: Date.now() - start,
            status: AIRequestStatus.error,
            error: JSON.stringify(payload)
          }
        });
        return reply.badRequest('Failed to create realtime token');
      }

      await prisma.aIRequestLog.create({
        data: {
          sessionId: id,
          kind: AIRequestKind.realtime,
          model: fastify.config.OPENAI_REALTIME_MODEL,
          latencyMs: Date.now() - start,
          status: AIRequestStatus.ok
        }
      });

      return { token: payload.client_secret?.value ?? payload.client_secret, session: payload };
    } catch (error) {
      await prisma.aIRequestLog.create({
        data: {
          sessionId: id,
          kind: AIRequestKind.realtime,
          model: fastify.config.OPENAI_REALTIME_MODEL,
          latencyMs: Date.now() - start,
          status: AIRequestStatus.error,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return reply.internalServerError('Failed to create realtime token');
    }
  });

  fastify.post('/sessions/:id/utterances/batch', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = utteranceBatchSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('Invalid utterance payload');

    const session = await prisma.journalSession.findFirst({ where: { id, userId: request.user.userId } });
    if (!session) return reply.notFound('Session not found');

    await prisma.utterance.createMany({
      data: parsed.data.items.map((item) => ({
        sessionId: id,
        speaker: item.speaker,
        startMs: item.startMs ?? null,
        endMs: item.endMs ?? null,
        text: item.text
      }))
    });

    return { ok: true };
  });

  fastify.post('/sessions/:id/end', async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = await prisma.journalSession.findFirst({ where: { id, userId: request.user.userId } });
    if (!session) return reply.notFound('Session not found');
    if (session.status !== SessionStatus.live) return reply.badRequest('Session is not live');

    const endedAt = new Date();
    const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));

    await prisma.journalSession.update({
      where: { id },
      data: { endedAt, durationSeconds, status: SessionStatus.processing }
    });

    await sessionQueue.add('process_session', { sessionId: id }, { attempts: 2, backoff: { type: 'fixed', delay: 3000 } });

    return { ok: true };
  });
};

export default sessionsRoutes;
