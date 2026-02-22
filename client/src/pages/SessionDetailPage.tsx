import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useRealtimeConversation } from '../hooks/useRealtimeConversation';

export const SessionDetailPage = () => {
  const { id = '' } = useParams();
  const [session, setSession] = useState<any>(null);
  const rt = useRealtimeConversation(id);

  const load = async () => {
    const res = await api.get(`/sessions/${id}`);
    setSession(res.data.session);
  };

  useEffect(() => { load().catch(() => undefined); }, [id]);
  useEffect(() => {
    if (!session) return;
    if (session.status === 'processing') {
      const t = setInterval(() => load().catch(() => undefined), 2000);
      return () => clearInterval(t);
    }
  }, [session]);

  const pendingMemories = useMemo(() => (session?.memoryCandidates ?? []).filter((m: any) => !m.approvedAt && !m.rejectedAt), [session]);

  const endConversation = async () => {
    await rt.stop();
    await api.post(`/sessions/${id}/end`);
    await load();
  };

  const actMemory = async (memoryId: string, action: 'approve'|'reject') => {
    await api.post(`/memory/${memoryId}/${action}`);
    await load();
  };

  if (!session) return <div>Loading...</div>;
  return <div className="space-y-4">
    <h1 className="text-2xl">{session.title ?? 'Live conversation'}</h1>
    <p>Status: {rt.status} {rt.error ? `(${rt.error})` : ''}</p>
    <div className="flex gap-2"><button onClick={rt.start}>Start Conversation</button><button onClick={endConversation}>End Conversation</button></div>
    {session.status === 'processing' && <p>Processing…</p>}
    <section><h2 className="text-xl">Transcript</h2><div className="space-y-1">{session.utterances.map((u: any)=><div key={u.id}><strong>{u.speaker}:</strong> {u.text}</div>)}</div></section>
    {session.artifact && <section className="space-y-2"><h2 className="text-xl">Curated Entry</h2><pre className="whitespace-pre-wrap">{session.artifact.curatedEntryMd}</pre></section>}
    {session.artifact && <section><h2>Summary</h2><ul>{session.artifact.summaryBulletsJson.map((s: string, i: number)=><li key={i}>• {s}</li>)}</ul></section>}
    <section><h2 className="text-xl">Memory candidates</h2>{pendingMemories.map((m: any)=><div key={m.id} className="border p-2 rounded my-2"><p>{m.text} ({m.category}, {m.confidence})</p><div className="flex gap-2"><button onClick={()=>actMemory(m.id,'approve')}>Approve</button><button onClick={()=>actMemory(m.id,'reject')}>Reject</button></div></div>)}</section>
  </div>;
};
