'use client';

import { useState } from 'react';
import { cardStyle, buttonStyle, colors } from './theme';

/**
 * Post-auth "here's your recovery code" card, shared by signup and
 * reset-password. The continue button stays disabled until the student
 * checks the "I've saved it" box.
 */
export default function RecoveryCodeCard({
  title,
  warningLead,
  warning,
  defaultWarning,
  code,
  continueLabel = 'Continue',
  checkboxLabel = 'I have written the code somewhere safe',
  onContinue,
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div style={cardStyle}>
      <h1
        style={{
          margin: '0 0 8px',
          fontSize: 24,
          fontWeight: 700,
          color: '#1a2332',
          textAlign: 'center',
        }}
      >
        {title}
      </h1>

      <div
        role="alert"
        style={{
          margin: '16px 0',
          padding: '14px 16px',
          background: '#fff6e5',
          border: '1px solid #e6c36a',
          borderRadius: 10,
          color: '#6b4e00',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <strong>{warningLead}</strong>
        <br />
        {warning || defaultWarning}
      </div>

      <p
        style={{
          margin: '20px 0 8px',
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 22,
          letterSpacing: '0.12em',
          fontWeight: 700,
          color: colors.codeText,
          padding: '16px',
          background: colors.codeBoxBg,
          borderRadius: 10,
          border: '1px dashed #9eb0c0',
          userSelect: 'all',
        }}
      >
        {code}
      </p>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          margin: '18px 2px 4px',
          fontSize: 14,
          fontFamily: 'system-ui, sans-serif',
          color: '#3a4557',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: colors.cyanDeep, cursor: 'pointer' }}
        />
        {checkboxLabel}
      </label>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!confirmed}
          style={{
            ...buttonStyle(!confirmed),
            marginTop: 16,
            textAlign: 'center',
            cursor: confirmed ? 'pointer' : 'not-allowed',
          }}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
