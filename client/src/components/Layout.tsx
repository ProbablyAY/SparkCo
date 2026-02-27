import { Link, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const Layout = () => {
  const nav = useNavigate();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // allow UI-only navigation for frontend-first iteration
    }
    nav('/login');
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex gap-4 items-center border-b border-slate-800 pb-3">
        <Link to="/sessions">Sessions</Link>
        <Link to="/memory">Memory</Link>
        <Link to="/settings">Settings</Link>
        <button className="ml-auto" onClick={logout}>
          Logout
        </button>
      </header>
      <p className="text-xs text-slate-400">Frontend mode: navigation and UI flows are enabled even if backend is unavailable.</p>
      <Outlet />
    </div>
  );
};
