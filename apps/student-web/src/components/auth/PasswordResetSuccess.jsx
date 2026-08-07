import AuthLogo from './AuthLogo';
import { colors, buttonStyle } from './theme';

/**
 * Minimal "password reset" confirmation. Breaks out of the navy AuthLayout
 * entirely — full white viewport, logo top-left, checkmark truly centered.
 */
export default function PasswordResetSuccess({ code, onContinue }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <AuthLogo dark />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
              border:"2px solid red",
              padding:"200px 0px"

          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: colors.navy,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5 L9.5 18 L20 6" />
            </svg>
          </div>

          <h1
            style={{
              margin: '0 0 10px',
              fontSize: 19,
              fontWeight: 800,
              color: colors.navy,
              lineHeight: 1.35,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            You Successfully Reset
            <br />
            Your Password!
          </h1>

          <p
            style={{
              margin: '0 0 6px',
              fontSize: 13,
              fontWeight: 600,
              color: '#5a6b7d',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Proceed
          </p>

          {code ? (
            <p
              style={{
                margin: '0 0 22px',
                fontSize: 11,
                letterSpacing: '0.04em',
                color: '#98A0B8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              Recovery code: {code}
            </p>
          ) : (
            <div style={{ marginBottom: 22 }} />
          )}

          <button type="button" onClick={onContinue} style={buttonStyle(false)}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
