import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.userId },
      select: { id: true, email: true, createdAt: true }
    });

    return { user };
  });

  fastify.delete('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.user.delete({ where: { id: request.user.userId } });
    reply.clearCookie('token', { path: '/' });
    return { ok: true };
  });
};

export default meRoutes;
