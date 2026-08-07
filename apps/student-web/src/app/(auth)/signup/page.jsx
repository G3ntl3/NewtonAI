'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signup } from '@/lib/authApi';
import { useSessionStore } from '@/stores/sessionStore';
import PasswordInput from '@/components/auth/PasswordInput';
import RecoveryCodeCard from '@/components/auth/RecoveryCodeCard';
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

function countNames(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function SignupPage() {
  const router = useRouter();
  const setUser = useSessionStore((s) => s.setUser);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [recovery, setRecovery] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});

    if (countNames(fullName) !== 3) {
      setFieldErrors({ fullName: 'Full name must be exactly three names (first middle last).' });
      return;
    }

    if (password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters' });
      return;
    }

    if (!schoolName.trim()) {
      setFieldErrors({ schoolName: 'School name is required' });
      return;
    }

    setPending(true);

    try {
      const { ok, data, status } = await signup({
        fullName: fullName.trim(),
        password,
        schoolName: schoolName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      if (!ok) {
        if (status === 409) {
          setFieldErrors({ form: data.error || 'An account with these details already exists.' });
        } else if (data.details) {
          const perField = Object.fromEntries(
            Object.entries(data.details.fieldErrors || {}).map(([field, messages]) => [
              field,
              messages[0],
            ])
          );
          const formMessage = data.details.formErrors?.[0];
          if (Object.keys(perField).length > 0 || formMessage) {
            setFieldErrors({ ...perField, ...(formMessage ? { form: formMessage } : {}) });
          } else {
            setFieldErrors({ form: data.error || 'Signup failed' });
          }
        } else {
          setFieldErrors({ form: data.error || 'Signup failed' });
        }
        return;
      }

      setUser(data.user);
      setRecovery({
        code: data.recoveryCode,
        warning: data.recoveryWarning,
      });
    } catch {
      setFieldErrors({ form: 'Unable to reach the server. Is student-web running?' });
    } finally {
      setPending(false);
    }
  }

  if (recovery?.code) {
    return (
      <RecoveryCodeCard
        title="Save your recovery code"
        warningLead="Write this code down and keep it somewhere safe."
        defaultWarning="You will need it to reset your password. We cannot show it again. Do not share it with anyone."
        code={recovery.code}
        warning={recovery.warning}
        continueLabel="Continue"
        onContinue={() => {
          router.push('/dashboard');
          router.refresh();
        }}
      />
    );
  }

  const nameCount = countNames(fullName);

  return (
    <div>
      <div style={{ padding: '4px 4px 0' }}>
        <p style={heroLabelStyle}>I&apos;m an</p>
        <h1 style={heroTitleStyle}>Engineer</h1>
      </div>

      {/* Reserves space over the fixed wave image painted by the auth layout. */}
      <div aria-hidden="true" style={{ height: 220 }} />

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        <div>
          <label htmlFor="schoolName" style={labelOnDarkStyle}>
            School Name
          </label>
          <input
            id="schoolName"
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            style={fieldOnDarkStyle}
            className="auth-field"
            placeholder="Name of your school"
          />
          {fieldErrors.schoolName ? <p style={inlineErrorOnDarkStyle}>{fieldErrors.schoolName}</p> : null}
        </div>

        <div>
          <label htmlFor="fullName" style={labelOnDarkStyle}>
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={fieldOnDarkStyle}
            className="auth-field"
            placeholder="Enter your three names"
          />
          {fieldErrors.fullName ? (
            <p style={inlineErrorOnDarkStyle}>{fieldErrors.fullName}</p>
          ) : (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                fontFamily: 'system-ui, sans-serif',
                color: nameCount === 3 ? '#48CAE4' : 'rgba(255, 255, 255, 0.55)',
              }}
            >
              {nameCount}/3 names entered
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" style={labelOnDarkStyle}>
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password must have at least 8 characters"
          />
          {fieldErrors.password ? <p style={inlineErrorOnDarkStyle}>{fieldErrors.password}</p> : null}
        </div>

        <div>
          <label htmlFor="email" style={labelOnDarkStyle}>
            Email <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldOnDarkStyle}
            className="auth-field"
            placeholder="email@address.com"
          />
          {fieldErrors.email ? <p style={inlineErrorOnDarkStyle}>{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="phoneNumber" style={labelOnDarkStyle}>
            Phone Number <span style={{ fontWeight: 400, opacity: 0.7 }}>(Optional)</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={fieldOnDarkStyle}
            className="auth-field"
            placeholder="+234 812 3456"
          />
          {fieldErrors.phoneNumber ? <p style={inlineErrorOnDarkStyle}>{fieldErrors.phoneNumber}</p> : null}
        </div>

        {fieldErrors.form ? (
          <p role="alert" style={{ ...inlineErrorOnDarkStyle, textAlign: 'center', fontSize: 13 }}>
            {fieldErrors.form}
          </p>
        ) : null}

        <button type="submit" disabled={pending} style={buttonStyle(pending)}>
          {pending ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p style={{ ...footerTextOnDarkStyle, margin: '24px 0 0' }}>
        <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`} style={linkOnDarkStyle}>
          I Have Trouble Signing Up
        </a>
      </p>

      <p style={footerTextOnDarkStyle}>
        Already have an account?{' '}
        <Link href="/login" style={linkOnDarkStyle}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
