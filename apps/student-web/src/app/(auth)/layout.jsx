import AuthLogo from '@/components/auth/AuthLogo';
import { colors } from '@/components/auth/theme';

/**
 * Auth layout — navy/wave shell for login / signup / recovery.
 */
export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: colors.navy,
        fontFamily: 'system-ui, sans-serif',
        color: '#fff',
      }}
    >
      {/* Fixed to the viewport, not the page — stays put while the form scrolls. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vector.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed',
          zIndex: 0,
          top: 90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(100vw, 488px)',
          height: 'auto',
          opacity: 0.4,
          marginTop:160,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ padding: '28px 0 20px' }}>
            <AuthLogo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
