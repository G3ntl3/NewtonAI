'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { login } from '@/lib/authApi';
import { useSessionStore } from '@/stores/sessionStore';
import PasswordInput from '@/components/auth/PasswordInput';
import {
  buttonStyle,
  inlineErrorOnDarkStyle,
  linkOnDarkStyle,
  footerTextOnDarkStyle,
  heroLabelStyle,
  heroTitleStyle,
  labelOnDarkStyle,
  fieldOnDarkStyle,
} from '@/components/auth/theme';

const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_NEWTON_SUPPORT_PHONE || '+234 800 111 2233';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useSessionStore((s) => s.setUser);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});
    setPending(true);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setFieldErrors({ identifier: 'Enter your full name' });
      setPending(false);
      return;
    }

    try {
      const { ok, data } = await login({ fullName: trimmed, password });
      if (!ok) {
        setFieldErrors({ form: data.error || 'Login failed' });
        return;
      }

      setUser(data.user);
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
      router.refresh();
    } catch {
      setFieldErrors({ form: 'Unable to reach the server. Is student-web running?' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div style={{ padding: '4px 4px 0' }}>
        <p style={heroLabelStyle}>I'm a,</p>
        <h1 style={heroTitleStyle}>SCIENTIST</h1>
      </div>

      {/* Reserves space over the fixed wave image painted by the auth layout. */}
      <div aria-hidden="true" style={{ height: 220 }} />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20,margin:"40px 0px" }}>
        <div>
          <label htmlFor="identifier" style={labelOnDarkStyle}>
            Full Name
          </label>
          <input
            id="identifier"
            type="text"
            autoComplete="name"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            style={fieldOnDarkStyle}
            className="auth-field"
            placeholder="Your full name"
          />
          {fieldErrors.identifier ? <p style={inlineErrorOnDarkStyle}>{fieldErrors.identifier}</p> : null}
        </div>

        <div>
          <label htmlFor="password" style={labelOnDarkStyle}>
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="******"
          />
        </div>

        {fieldErrors.form ? (
          <p role="alert" style={{ ...inlineErrorOnDarkStyle, textAlign: 'center', fontSize: 13 }}>
            {fieldErrors.form}
          </p>
        ) : null}

        <button type="submit" disabled={pending} style={buttonStyle(pending)}>
          {pending ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p style={{ ...footerTextOnDarkStyle, margin: '20px 0 0' }}>
        <Link href="/reset-password" style={linkOnDarkStyle}>
          Reset password with recovery code
        </Link>
      </p>

     

      <p style={footerTextOnDarkStyle}>
        No account?{' '}
        <Link href="/signup" style={linkOnDarkStyle}>
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', color: '#fff' }}>Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
