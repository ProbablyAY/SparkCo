import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const SignupPage = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/signup', { email, password });
      nav('/sessions');
    } catch {
      setError('Backend unavailable. Continuing in UI-only mode.');
      nav('/sessions');
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto mt-20 space-y-3">
      <h1 className="text-2xl">Sign up</h1>
      {error && <p>{error}</p>}
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)" />
      <button type="submit">Create account</button>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </form>
  );
};
