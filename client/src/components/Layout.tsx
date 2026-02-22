import { Link, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const Layout = () => {
  const nav = useNavigate();
  const logout = async () => {
    await api.post('/auth/logout');
    nav('/login');
  };
  return (
    <div className="min-h-screen max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex gap-4 items-center">
        <Link to="/sessions">Sessions</Link>
        <Link to="/memory">Memory</Link>
        <Link to="/settings">Settings</Link>
        <button className="ml-auto" onClick={logout}>Logout</button>
      </header>
      <Outlet />
    </div>
  );
};
