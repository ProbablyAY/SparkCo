import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { createSession, getSessions, type SessionListItem } from '../lib/clientData';

export const SessionsPage = () => {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const nav = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.sessions as SessionListItem[]);
    } catch {
      setSessions(getSessions());
    }
  };

  const startConversation = async () => {
    try {
      const res = await api.post('/sessions');
      nav(`/sessions/${res.data.session.id}`);
    } catch {
      const session = createSession();
      nav(`/sessions/${session.id}`);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <button onClick={startConversation}>Start Conversation</button>
      <div className="space-y-2">
        {sessions.map((s) => (
          <Link className="block border p-3 rounded" key={s.id} to={`/sessions/${s.id}`}>
            <div>{s.title ?? 'Untitled session'}</div>
            <div className="text-sm opacity-70">
              {new Date(s.startedAt).toLocaleString()} • {s.status}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
