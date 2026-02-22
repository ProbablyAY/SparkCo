import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useRealtimeConversation } from '../hooks/useRealtimeConversation';
import type { MemoryCandidate, SessionDetail } from '../lib/types';

export const SessionDetailPage = () => {
  const { id = '' } = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const rt = useRealtimeConversation(id);

  const load = async () => {
    const res = await api.get<{ session: SessionDetail }>(`/sessions/${id}`);
    setSession(res.data.session);
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (session?.status !== 'processing') return;
    const timer = setInterval(() => load().catch(() => undefined), 2000);
    return () => clearInterval(timer);
  }, [session?.status]);

  const pendingMemories = useMemo(
    () => (session?.memoryCandidates ?? []).filter((m) => !m.approvedAt && !m.rejectedAt),
    [session]
  );

  const endConversation = async () => {
    await rt.stop();
    await api.post(`/sessions/${id}/end`);
    await load();
  };

  const actMemory = async (memoryId: string, action: 'approve' | 'reject') => {
    await api.post(`/memory/${memoryId}/${action}`);
    await load();
  };

  if (!session) return <div>Loading...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">{session.title ?? 'Live conversation'}</h1>
      <p>
        Live status: {rt.status} {rt.error ? `(${rt.error})` : ''}
      </p>

      <div className="flex gap-2">
        <button onClick={rt.start}>Start Conversation</button>
        <button onClick={endConversation}>End Conversation</button>
      </div>

      {session.status === 'processing' && <p>Processing…</p>}
      {session.status === 'failed' && <p>Session processing failed. Please try a new conversation.</p>}

      <section>
        <h2 className="text-xl">Transcript</h2>
        <div className="space-y-1">
          {session.utterances.map((u) => (
            <div key={u.id}>
              <strong>{u.speaker}:</strong> {u.text}
            </div>
          ))}
        </div>
      </section>

      {session.artifact && (
        <>
          <section className="space-y-2">
            <h2 className="text-xl">Curated Entry</h2>
            <pre className="whitespace-pre-wrap">{session.artifact.curatedEntryMd}</pre>
          </section>
          <section>
            <h2 className="text-xl">Summary</h2>
            <ul>{session.artifact.summaryBulletsJson.map((s, i) => <li key={i}>• {s}</li>)}</ul>
          </section>
          <section>
            <h2 className="text-xl">Themes</h2>
            <div className="flex flex-wrap gap-2">{session.artifact.themesJson.map((t) => <span className="px-2 py-1 bg-slate-800 rounded" key={t}>{t}</span>)}</div>
          </section>
          <section>
            <h2 className="text-xl">Emotional timeline</h2>
            {session.artifact.emotionalTimelineJson.map((e, i) => (
              <div key={i} className="border p-2 rounded my-2">
                <strong>{e.t}</strong>: {e.label}
                <div className="text-sm opacity-80">Evidence: {e.evidence}</div>
              </div>
            ))}
          </section>
          <section>
            <h2 className="text-xl">Key moments</h2>
            {session.artifact.keyMomentsJson.map((m, i) => (
              <div key={i} className="border p-2 rounded my-2">
                <div>{m.moment} ({m.timestamp_ms}ms)</div>
                <div className="text-sm opacity-80">{m.why_it_matters}</div>
              </div>
            ))}
          </section>
          <section>
            <h2 className="text-xl">Follow-up questions</h2>
            <ul>{session.artifact.followupQuestionsJson.map((q, i) => <li key={i}>• {q}</li>)}</ul>
          </section>
        </>
      )}

      <section>
        <h2 className="text-xl">Memory candidates</h2>
        {pendingMemories.map((m: MemoryCandidate) => (
          <div key={m.id} className="border p-2 rounded my-2">
            <p>
              {m.text} ({m.category}, {m.confidence.toFixed(2)})
            </p>
            <div className="flex gap-2">
              <button onClick={() => actMemory(m.id, 'approve')}>Approve</button>
              <button onClick={() => actMemory(m.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
