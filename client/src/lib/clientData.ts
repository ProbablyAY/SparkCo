import type { MemoryCandidate, SessionDetail } from './types';

export type SessionListItem = {
  id: string;
  startedAt: string;
  durationSeconds: number | null;
  title: string | null;
  status: 'live' | 'processing' | 'ready' | 'failed';
};

const SESSIONS_KEY = 'ai_journal_demo_sessions';
const MEMORY_KEY = 'ai_journal_demo_memory';

const now = new Date().toISOString();

const starterSession: SessionDetail = {
  id: 'demo-session-1',
  title: 'A gentle reset for the day',
  status: 'ready',
  utterances: [
    { id: 'u1', speaker: 'ai', text: 'Hey! How has your day been so far?', startMs: null, endMs: null },
    { id: 'u2', speaker: 'user', text: 'Busy but productive. I felt better after lunch.', startMs: null, endMs: null }
  ],
  artifact: {
    curatedEntryMd: 'Today had pressure, but you found momentum and a calmer rhythm by mid-day.',
    summaryBulletsJson: ['Busy morning with pressure', 'Energy improved after lunch'],
    themesJson: ['energy', 'focus', 'routine'],
    emotionalTimelineJson: [
      { t: 'start', label: 'stretched', evidence: 'busy morning' },
      { t: 'mid', label: 'steady', evidence: 'post-lunch reset' },
      { t: 'end', label: 'optimistic', evidence: 'clear plan for tomorrow' }
    ],
    keyMomentsJson: [{ timestamp_ms: 12000, moment: 'Post-lunch shift', why_it_matters: 'It changed the tone of the day.' }],
    followupQuestionsJson: ['What helped you reset most today?']
  },
  memoryCandidates: [
    { id: 'm1', category: 'preference', text: 'Short breaks help me refocus', confidence: 0.86, approvedAt: null, rejectedAt: null }
  ]
};

const read = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export const ensureSeedData = () => {
  const existing = read<SessionDetail[]>(SESSIONS_KEY, []);
  if (existing.length > 0) return;
  write(SESSIONS_KEY, [starterSession]);
  write<MemoryCandidate[]>(MEMORY_KEY, []);
};

export const getSessions = (): SessionListItem[] => {
  ensureSeedData();
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  return sessions.map((s) => ({
    id: s.id,
    startedAt: now,
    durationSeconds: null,
    title: s.title,
    status: s.status
  }));
};

export const createSession = (): SessionDetail => {
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  const id = `demo-session-${Date.now()}`;
  const next: SessionDetail = {
    id,
    title: null,
    status: 'live',
    utterances: [],
    artifact: null,
    memoryCandidates: []
  };
  write(SESSIONS_KEY, [next, ...sessions]);
  return next;
};

export const getSessionById = (id: string): SessionDetail | null => {
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  return sessions.find((s) => s.id === id) ?? null;
};

export const updateSession = (next: SessionDetail) => {
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  write(
    SESSIONS_KEY,
    sessions.map((s) => (s.id === next.id ? next : s))
  );
};

export const approveMemory = (id: string) => {
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  const approved = read<MemoryCandidate[]>(MEMORY_KEY, []);
  for (const session of sessions) {
    const target = session.memoryCandidates.find((m) => m.id === id);
    if (target) {
      target.approvedAt = new Date().toISOString();
      target.rejectedAt = null;
      write(MEMORY_KEY, [target, ...approved.filter((m) => m.id !== id)]);
    }
  }
  write(SESSIONS_KEY, sessions);
};

export const rejectMemory = (id: string) => {
  const sessions = read<SessionDetail[]>(SESSIONS_KEY, []);
  for (const session of sessions) {
    const target = session.memoryCandidates.find((m) => m.id === id);
    if (target) {
      target.rejectedAt = new Date().toISOString();
      target.approvedAt = null;
    }
  }
  write(SESSIONS_KEY, sessions);
};

export const getApprovedMemory = (): MemoryCandidate[] => read<MemoryCandidate[]>(MEMORY_KEY, []);

export const clearDemoData = () => {
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(MEMORY_KEY);
};
