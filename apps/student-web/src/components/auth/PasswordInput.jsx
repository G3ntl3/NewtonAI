'use client';

import { useState } from 'react';
import { fieldOnDarkStyle, fieldStyle } from './theme';

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.6 19.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a19.6 19.6 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Password field with a show/hide toggle. `variant="dark"` (default) matches
 * the outlined fields on the navy login/signup screens; `variant="light"`
 * matches the white-card fields (e.g. reset-password).
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  variant = 'dark',
  style,
}) {
  const [visible, setVisible] = useState(false);
  const isDark = variant === 'dark';

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        style={{ ...(isDark ? fieldOnDarkStyle : fieldStyle), ...style, paddingRight: 48 }}
        className={isDark ? 'auth-field' : undefined}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 4,
          margin: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#5a6b7d',
        }}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
