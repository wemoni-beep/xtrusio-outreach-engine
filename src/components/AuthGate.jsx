import { useEffect, useState } from 'react';
import { onAuthChange, signInWithGoogle } from '../firebase/auth';
import { bootSync } from '../firebase/cloudSync';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncState, setSyncState] = useState('idle'); // idle | syncing | ready | error

  useEffect(() => {
    return onAuthChange((u) => setUser(u || null));
  }, []);

  // Run one-shot cloud sync after a user signs in, before rendering the app.
  useEffect(() => {
    if (!user) {
      setSyncState('idle');
      return;
    }
    let cancelled = false;
    setSyncState('syncing');
    bootSync()
      .then((results) => {
        if (cancelled) return;
        const anyError = results.some((r) => r.action === 'error');
        setSyncState(anyError ? 'error' : 'ready');
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('[AuthGate] bootSync failed', e);
        setSyncState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900">Xtrusio Outreach Engine</h1>
          <p className="text-sm text-slate-500">Sign in with your Google account to continue.</p>
          <button
            onClick={handleSignIn}
            disabled={busy}
            className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
      </div>
    );
  }

  if (syncState === 'syncing' || syncState === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-500">Syncing your data…</div>
      </div>
    );
  }

  if (syncState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 space-y-3 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Sync issue</h1>
          <p className="text-sm text-slate-500">
            We couldn't reach the cloud backup. You can continue with local data, but changes won't sync until you reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return children;
}
