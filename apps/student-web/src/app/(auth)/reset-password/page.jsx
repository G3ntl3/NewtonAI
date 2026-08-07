'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { resetPassword } from '@/lib/authApi';
import { useSessionStore } from '@/stores/sessionStore';
import PasswordResetSuccess from '@/components/auth/PasswordResetSuccess';
import PasswordInput from '@/components/auth/PasswordInput';
import { inlineErrorStyle } from '@/components/auth/theme';

const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_NEWTON_SUPPORT_PHONE || '+234 800 111 2233';

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #c5d0db',
  borderRadius: 8,
  fontSize: 16,
  fontFamily: 'inherit',
  background: '#fff',
  boxSizing: 'border-box',
  color:"black"
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'system-ui, sans-serif',
  color:"black"
};

/**
 * Student-only password reset via recovery code.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [recovery, setRecovery] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});

    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setPending(true);

    try {
      const submittedCode = code.trim();
      const { ok, data } = await resetPassword({
        code: submittedCode,
        newPassword,
      });

      if (!ok) {
        setFieldErrors({ form: data.error || 'Could not reset password' });
        return;
      }

      setUser(data.user);
      setRecovery({
        // Always show the same code the student entered — never a newly generated one.
        code: data.recoveryCode || submittedCode,
        warning: data.recoveryWarning,
      });
    } catch {
      setFieldErrors({ form: 'Unable to reach the server.' });
    } finally {
      setPending(false);
    }
  }

  if (recovery?.code) {
    return (
      <PasswordResetSuccess
        code={recovery.code}
        onContinue={() => {
          router.push('/dashboard');
          router.refresh();
        }}
      />
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #d7e0e8',
        borderRadius: 16,
        padding: '32px 28px',
        boxShadow: '0 12px 40px rgba(26, 35, 50, 0.08)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5a6b7d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Newton AI · Students
      </p>
      <h1 style={{ margin: '8px 0 8px', fontSize: 28, fontWeight: 700 }}>Reset password</h1>
      <p style={{ margin: '0 0 24px', color: '#5a6b7d', fontFamily: 'system-ui, sans-serif', fontSize: 15 }}>
        Enter the recovery code you saved when you registered, then choose a new password.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label htmlFor="code" style={labelStyle}>
            Recovery code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              ...fieldStyle,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:"black"
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
          />
          {fieldErrors.code ? <p style={inlineErrorStyle}>{fieldErrors.code}</p> : null}
        </div>

        <div>
          <label htmlFor="newPassword" style={labelStyle}>
            New password
          </label>
          <PasswordInput
            id="newPassword"
            variant="light"
            style={fieldStyle}
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          {fieldErrors.newPassword ? <p style={inlineErrorStyle}>{fieldErrors.newPassword}</p> : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" style={labelStyle}>
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            variant="light"
            style={fieldStyle}
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword ? (
            <p style={inlineErrorStyle}>{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>

        {fieldErrors.form ? (
          <p role="alert" style={{ ...inlineErrorStyle, textAlign: 'center', fontSize: 13 }}>
            {fieldErrors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 4,
            padding: '12px 16px',
            border: 'none',
            borderRadius: 8,
            background: pending ? '#7a8fa3' : '#1a4f7a',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: pending ? 'wait' : 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {pending ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <div
        style={{
          marginTop: 24,
          padding: '14px 16px',
          background: '#f4f7fa',
          border: '1px solid #d7e0e8',
          borderRadius: 10,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          color: '#1a2332',
          lineHeight: 1.5,
        }}
      >
        <strong>Lost your recovery code or can&apos;t reset?</strong>
        <br />
        Call Newton support:{' '}
        <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} style={{ color: '#1a4f7a', fontWeight: 600 }}>
          {SUPPORT_PHONE}
        </a>
      </div>

      <p
        style={{
          margin: '20px 0 0',
          textAlign: 'center',
          fontSize: 14,
          color: '#5a6b7d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <Link href="/login" style={{ color: '#1a4f7a', fontWeight: 600 }}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
