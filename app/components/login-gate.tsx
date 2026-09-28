'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';

export function LoginGate({ children }: { children: (user: User) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError('');
    try { await signInWithEmailAndPassword(firebaseAuth, email.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); }
  }

  if (!ready) return <main className="auth-shell"><div className="auth-card"><span className="eyebrow">VI SWEETS</span><h1>Loading workspace</h1><p>Checking the secure admin session…</p></div></main>;
  if (!user) return <main className="auth-shell"><form className="auth-card" onSubmit={login}><div className="brand-mark">VS</div><span className="eyebrow">PRIVATE CONTROL ROOM</span><h1>Sign in to VI Sweets</h1><p>Use the Firebase admin account. Access is checked again on the server for every publish.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <small className="error-message">{error}</small>}<button className="primary-button" type="submit">Sign in securely</button></form></main>;
  return <>{children(user)}<button className="logout-button" onClick={() => signOut(firebaseAuth)}>Sign out</button></>;
}
