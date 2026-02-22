import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type Session = { id: string; startedAt: string; durationSeconds: number | null; title: string | null; status: string };

export const SessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const nav = useNavigate();

  const load = async () => {
    const res = await api.get('/sessions');
    setSessions(res.data.sessions);
  };

  const createSession = async () => {
    const res = await api.post('/sessions');
    nav(`/sessions/${res.data.session.id}`);
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  return <div className="space-y-4"><button onClick={createSession}>Start Conversation</button><div className="space-y-2">{sessions.map(s=><Link className="block border p-3 rounded" key={s.id} to={`/sessions/${s.id}`}><div>{s.title ?? 'Untitled session'}</div><div className="text-sm opacity-70">{new Date(s.startedAt).toLocaleString()} • {s.status}</div></Link>)}</div></div>;
};
