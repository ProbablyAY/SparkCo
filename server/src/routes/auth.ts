import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/auth/signup', async (request, reply) => {
    const parsed = credsSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('Invalid signup payload');

    const { email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.conflict('Email already in use');

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true }
    });

    const token = await reply.jwtSign({ userId: user.id, email: user.email });
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: fastify.config.NODE_ENV === 'production'
    });

    return { user };
  });

  fastify.post('/auth/login', async (request, reply) => {
    const parsed = credsSchema.safeParse(request.body);
    if (!parsed.success) return reply.badRequest('Invalid login payload');

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.unauthorized('Invalid credentials');

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return reply.unauthorized('Invalid credentials');

    const token = await reply.jwtSign({ userId: user.id, email: user.email });
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: fastify.config.NODE_ENV === 'production'
    });

    return { user: { id: user.id, email: user.email, createdAt: user.createdAt } };
  });

  fastify.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { ok: true };
  });
};

export default authRoutes;
