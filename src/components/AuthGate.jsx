import { useEffect, useState } from 'react';
import { onAuthChange, signInWithGoogle } from '../firebase/auth';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthChange((u) => setUser(u || null));
  }, []);

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

  return children;
}
