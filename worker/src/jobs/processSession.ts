import { AIRequestKind, AIRequestStatus, SessionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../env.js';
import { curatorOutputSchema, type CuratorOutput } from './curatorSchema.js';

const buildTranscript = (utterances: { speaker: 'user' | 'ai'; startMs: number | null; endMs: number | null; text: string }[]) =>
  utterances
    .map((u) => {
      const ts = u.startMs != null || u.endMs != null ? ` [${u.startMs ?? '?'}-${u.endMs ?? '?'}ms]` : '';
      return `${u.speaker.toUpperCase()}${ts}: ${u.text}`;
    })
    .join('\n');

const prompt = (transcript: string) => `Return strict JSON only matching schema. Transcript:\n${transcript}`;

const callCurator = async (text: string) => {
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.OPENAI_CURATOR_MODEL,
      input: text,
      text: { format: { type: 'json_object' } }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  const outputText = data.output_text ?? data.output?.[0]?.content?.[0]?.text ?? '{}';
  return outputText as string;
};

export const processSession = async (sessionId: string) => {
  const session = await prisma.journalSession.findUnique({ where: { id: sessionId }, include: { utterances: true } });
  if (!session) throw new Error('Session not found');

  if (session.utterances.length === 0) {
    await prisma.journalSession.update({ where: { id: sessionId }, data: { status: SessionStatus.failed, title: 'Failed: empty transcript' } });
    await prisma.aIRequestLog.create({
      data: {
        sessionId,
        kind: AIRequestKind.curate,
        model: env.OPENAI_CURATOR_MODEL,
        status: AIRequestStatus.error,
        error: 'No utterances available'
      }
    });
    return;
  }

  const transcript = buildTranscript(session.utterances as never);
  const start = Date.now();
  try {
    const raw = await callCurator(prompt(transcript));
    let parsed: CuratorOutput | null = null;
    try {
      parsed = curatorOutputSchema.parse(JSON.parse(raw));
    } catch {
      const fixedRaw = await callCurator(`Fix this JSON to match required schema exactly and return only JSON: ${raw}`);
      parsed = curatorOutputSchema.parse(JSON.parse(fixedRaw));
    }

    await prisma.$transaction([
      prisma.artifact.upsert({
        where: { sessionId },
        create: {
          sessionId,
          curatedEntryMd: parsed.curated_entry_md,
          summaryBulletsJson: parsed.summary_bullets,
          themesJson: parsed.themes,
          emotionalTimelineJson: parsed.emotional_timeline,
          keyMomentsJson: parsed.key_moments,
          followupQuestionsJson: parsed.followup_questions
        },
        update: {
          curatedEntryMd: parsed.curated_entry_md,
          summaryBulletsJson: parsed.summary_bullets,
          themesJson: parsed.themes,
          emotionalTimelineJson: parsed.emotional_timeline,
          keyMomentsJson: parsed.key_moments,
          followupQuestionsJson: parsed.followup_questions
        }
      }),
      prisma.memoryCandidate.createMany({
        data: parsed.memory_candidates.map((item) => ({
          userId: session.userId,
          sessionId,
          category: item.category,
          text: item.text,
          confidence: item.confidence
        }))
      }),
      prisma.journalSession.update({ where: { id: sessionId }, data: { status: SessionStatus.ready, title: parsed.title } }),
      prisma.aIRequestLog.create({
        data: {
          sessionId,
          kind: AIRequestKind.curate,
          model: env.OPENAI_CURATOR_MODEL,
          latencyMs: Date.now() - start,
          status: AIRequestStatus.ok
        }
      })
    ]);
  } catch (error) {
    await prisma.journalSession.update({ where: { id: sessionId }, data: { status: SessionStatus.failed, title: 'Processing failed' } });
    await prisma.aIRequestLog.create({
      data: {
        sessionId,
        kind: AIRequestKind.curate,
        model: env.OPENAI_CURATOR_MODEL,
        latencyMs: Date.now() - start,
        status: AIRequestStatus.error,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
};
