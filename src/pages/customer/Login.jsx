import { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.4 0-11.7-3.7-13.6-9.1l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/menu';
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function onSignIn() {
    setBusy(true);
    setErr('');
    try {
      await signInWithGoogle(from);
      // Redirects away to Google — keep the button busy until navigation.
    } catch (e) {
      setErr(e?.message || 'Could not start sign-in. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md flex-col items-center justify-center text-center">
      <div className="animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-espresso-700 font-serif text-3xl text-ivory">
          V
        </div>
        <p className="c-eyebrow mt-6">Vilasa Cafe</p>
        <h1 className="mt-2 font-serif text-[2rem] leading-tight text-espresso-700">
          Welcome in. Let's get you fed.
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-stone">
          Sign in with Google to place orders and track them live. Cash on delivery for
          SRM AP, VIT AP and Amrita AP.
        </p>
      </div>

      <button
        onClick={onSignIn}
        disabled={busy}
        className="c-btn-outline mt-8 h-12 w-full gap-3 text-base disabled:opacity-60"
      >
        <GoogleMark />
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-stone">
        <ShieldCheck size={14} />
        We only use your Google account to identify orders. No passwords.
      </p>

      <p className="mt-4 text-xs text-stone/80">
        Just browsing?{' '}
        <a href="/menu" className="font-semibold text-terracotta-600 hover:underline">
          Explore the menu first
        </a>
        .
      </p>
    </div>
  );
}
