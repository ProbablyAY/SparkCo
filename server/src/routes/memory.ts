import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const memoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/memory', async (request) => {
    const memory = await prisma.memoryCandidate.findMany({
      where: { userId: request.user.userId, approvedAt: { not: null } },
      orderBy: { createdAt: 'desc' }
    });
    return { memory };
  });

  fastify.post('/memory/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.memoryCandidate.findFirst({ where: { id, userId: request.user.userId } });
    if (!item) return reply.notFound('Memory candidate not found');

    const updated = await prisma.memoryCandidate.update({
      where: { id },
      data: { approvedAt: new Date(), rejectedAt: null }
    });
    return { memory: updated };
  });

  fastify.post('/memory/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.memoryCandidate.findFirst({ where: { id, userId: request.user.userId } });
    if (!item) return reply.notFound('Memory candidate not found');

    const updated = await prisma.memoryCandidate.update({
      where: { id },
      data: { rejectedAt: new Date(), approvedAt: null }
    });
    return { memory: updated };
  });
};

export default memoryRoutes;
