-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('live', 'processing', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "Speaker" AS ENUM ('user', 'ai');

-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('preference', 'goal', 'relationship', 'project', 'value', 'other');

-- CreateEnum
CREATE TYPE "AIRequestKind" AS ENUM ('realtime', 'curate');

-- CreateEnum
CREATE TYPE "AIRequestStatus" AS ENUM ('ok', 'error');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL,
    "title" TEXT,
    "durationSeconds" INTEGER,

    CONSTRAINT "JournalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utterance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speaker" "Speaker" NOT NULL,
    "startMs" INTEGER,
    "endMs" INTEGER,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utterance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "sessionId" TEXT NOT NULL,
    "curatedEntryMd" TEXT NOT NULL,
    "summaryBulletsJson" JSONB NOT NULL,
    "themesJson" JSONB NOT NULL,
    "emotionalTimelineJson" JSONB NOT NULL,
    "keyMomentsJson" JSONB NOT NULL,
    "followupQuestionsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "MemoryCandidate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "category" "MemoryCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRequestLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "kind" "AIRequestKind" NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "status" "AIRequestStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "JournalSession_userId_startedAt_idx" ON "JournalSession"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "Utterance_sessionId_createdAt_idx" ON "Utterance"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryCandidate_userId_approvedAt_idx" ON "MemoryCandidate"("userId", "approvedAt");

-- CreateIndex
CREATE INDEX "AIRequestLog_sessionId_createdAt_idx" ON "AIRequestLog"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "JournalSession" ADD CONSTRAINT "JournalSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utterance" ADD CONSTRAINT "Utterance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "JournalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "JournalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryCandidate" ADD CONSTRAINT "MemoryCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryCandidate" ADD CONSTRAINT "MemoryCandidate_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "JournalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequestLog" ADD CONSTRAINT "AIRequestLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "JournalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
