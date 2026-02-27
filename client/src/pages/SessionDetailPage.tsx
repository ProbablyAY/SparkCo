import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useRealtimeConversation } from '../hooks/useRealtimeConversation';
import { approveMemory, getSessionById, rejectMemory } from '../lib/clientData';
import type { MemoryCandidate, SessionDetail } from '../lib/types';

export const SessionDetailPage = () => {
  const { id = '' } = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const rt = useRealtimeConversation(id);

  const load = async () => {
    try {
      const res = await api.get<{ session: SessionDetail }>(`/sessions/${id}`);
      setUsingFallback(false);
      setSession(res.data.session);
    } catch {
      setUsingFallback(true);
      setSession(getSessionById(id));
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, [id]);

  const pendingMemories = useMemo(
    () => (session?.memoryCandidates ?? []).filter((m) => !m.approvedAt && !m.rejectedAt),
    [session]
  );

  const endConversation = async () => {
    await rt.stop();
    if (usingFallback) {
      setSession((prev) => (prev ? { ...prev, status: 'processing' } : prev));
      setTimeout(() => {
        setSession((prev) =>
          prev
            ? ({
                ...prev,
                status: 'ready',
                title: prev.title ?? 'Demo processed session'
              } as SessionDetail)
            : prev
        );
      }, 1200);
      return;
    }

    await api.post(`/sessions/${id}/end`);
    await load();
  };

  const actMemory = async (memoryId: string, action: 'approve' | 'reject') => {
    if (usingFallback) {
      if (action === 'approve') approveMemory(memoryId);
      else rejectMemory(memoryId);
      await load();
      return;
    }

    await api.post(`/memory/${memoryId}/${action}`);
    await load();
  };

  if (!session)
    return (
      <div className="space-y-3">
        <p>Session not found.</p>
        <Link to="/sessions" className="underline">
          Back to sessions
        </Link>
      </div>
    );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">{session.title ?? 'Live conversation'}</h1>
      <p>
        Live status: {rt.status} {rt.error ? `(${rt.error})` : ''}
      </p>
      {usingFallback && <p className="text-sm text-amber-300">Using local UI fallback data.</p>}

      <div className="flex gap-2">
        <button onClick={rt.start}>Start Conversation</button>
        <button onClick={endConversation}>End Conversation</button>
        <Link to="/sessions" className="px-4 py-2 rounded bg-slate-700">
          Back
        </Link>
      </div>

      {session.status === 'processing' && <p>Processing…</p>}
      {session.status === 'failed' && <p>Session processing failed. Please try a new conversation.</p>}

      <section>
        <h2 className="text-xl">Transcript</h2>
        <div className="space-y-1">
          {session.utterances.length === 0 ? <p className="opacity-70">No transcript yet.</p> : null}
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
            <div className="flex flex-wrap gap-2">
              {session.artifact.themesJson.map((t) => (
                <span className="px-2 py-1 bg-slate-800 rounded" key={t}>
                  {t}
                </span>
              ))}
            </div>
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
