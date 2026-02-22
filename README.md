# AI Journaling MVP (Closed Beta)

Private, voice-first journaling app with realtime AI conversation, text-only transcript storage, post-session curation, and opt-in long-term memory.

## Stack
- Client: React + Vite + TypeScript + react-router-dom + Tailwind + Radix UI
- Server: Fastify + TypeScript + Prisma + Postgres + JWT cookie auth + pino
- Worker: Node + TypeScript + BullMQ + Redis
- Validation: zod

## Privacy model
- **No raw audio is stored**.
- Only text transcript events (`Utterance.text`) and derived artifacts are stored.
- Memory is opt-in via approve/reject flow.

## Repo structure
- `infra/`: docker-compose for Postgres + Redis
- `server/`: API service
- `worker/`: queue worker for session processing
- `client/`: web app

## Environment
### server/.env
Use `server/.env.example`:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_REALTIME_MODEL`
- `OPENAI_CURATOR_MODEL`
- `CORS_ORIGIN`

### worker/.env
Use `worker/.env.example`.

### client/.env
Use `client/.env.example`.

## Local run
1. Start infra:
```bash
cd infra && docker-compose up -d
```
2. Server:
```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```
3. Worker:
```bash
cd worker
npm install
cp .env.example .env
npm run dev
```
4. Client:
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## API coverage implemented
- Auth: signup/login/logout/me/delete-me
- Sessions: create/list/detail/realtime-token/utterance-batch/end
- Memory: list approved + approve + reject
- Health: `/health`

## Worker flow
`process_session`:
1. Load transcript
2. Fail if empty
3. Curate via OpenAI model to strict JSON
4. zod-validate; retry once with JSON-fix prompt
5. Save `Artifact`
6. Save `MemoryCandidate`
7. Mark session `ready` and set title

## Notes
- Realtime uses browser WebRTC and ephemeral tokens minted server-side.
- Transcript ingestion relies on realtime event channel text messages where available.
- If realtime transcript events are sparse, any available text events are still batched and persisted.
