# AI Journaling MVP

Monorepo scaffold for a private, voice-first AI journaling app.

## Repo structure

- `client/` – React + Vite frontend (scaffolded for upcoming steps)
- `server/` – Fastify + Prisma API (implemented in this step)
- `worker/` – BullMQ worker (scaffolded for upcoming steps)
- `infra/` – Docker Compose for Postgres + Redis

## Step implemented

This iteration includes:
- Infrastructure: Postgres + Redis via docker-compose
- Server foundation:
  - Fastify app bootstrap with pino logging, CORS, cookies, JWT
  - Auth endpoints (`/auth/signup`, `/auth/login`, `/auth/logout`)
  - User endpoints (`/me`, `DELETE /me`)
  - Health endpoint (`/health`)
- Prisma schema with all required models, enums, relations, and indexes
- Environment templates for all packages
- Basic API test for health endpoint

## Run locally (current state)

1. Start infra:
   ```bash
   cd infra && docker-compose up -d
   ```
2. Start server:
   ```bash
   cd server
   npm install
   cp .env.example .env
   npx prisma migrate dev --name init
   npm run dev
   ```
3. Run server tests:
   ```bash
   cd server && npm test
   ```

## Notes

- Raw audio storage is intentionally not implemented and will remain disallowed in future steps.
- Realtime voice, worker processing, and client UI are planned in the next implementation phases.
