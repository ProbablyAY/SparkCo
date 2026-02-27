export type Utterance = {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  startMs: number | null;
  endMs: number | null;
};

export type Artifact = {
  curatedEntryMd: string;
  summaryBulletsJson: string[];
  themesJson: string[];
  emotionalTimelineJson: { t: 'start' | 'mid' | 'end'; label: string; evidence: string }[];
  keyMomentsJson: { timestamp_ms: number; moment: string; why_it_matters: string }[];
  followupQuestionsJson: string[];
};

export type MemoryCandidate = {
  id: string;
  category: 'preference' | 'goal' | 'relationship' | 'project' | 'value' | 'other';
  text: string;
  confidence: number;
  approvedAt: string | null;
  rejectedAt: string | null;
};

export type SessionDetail = {
  id: string;
  title: string | null;
  status: 'live' | 'processing' | 'ready' | 'failed';
  utterances: Utterance[];
  artifact: Artifact | null;
  memoryCandidates: MemoryCandidate[];
};
