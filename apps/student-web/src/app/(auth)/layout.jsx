import AuthLogo from '@/components/auth/AuthLogo';
import { colors } from '@/components/auth/theme';

/**
 * Auth layout — navy/wave shell for login / signup / recovery.
 *
 * Mobile: a single full-height navy column, exactly as before.
 * Desktop: a full-height, horizontally centred panel — navy form column on
 * the left, tutor illustration on the right — sitting on a pale "glassy"
 * backdrop that shows down either side.
 */
export default function AuthLayout({ children }) {
  return (
    <div
      className="md:h-screen md:flex md:items-stretch md:justify-center"
      style={{
        // Glassy backdrop picked to match the pale blue-white in the tutor
        // illustration, built on the existing theme `card` token so it stays
        // in the same family as the rest of the auth screens.
        background: `linear-gradient(135deg, #F2F6FD 0%, ${colors.card} 55%, #DCE5F7 100%)`,
      }}
    >
      <div
        className="
          w-full md:max-w-[1100px] md:h-screen
          md:flex md:overflow-hidden
          md:shadow-2xl md:shadow-newton-bg/25
        "
      >
        {/* ── Form column ───────────────────────────────────────────────
            Scrolls on its own so the tall signup form never pushes the
            card (or the illustration) out of alignment. min-h-screen keeps
            the mobile behaviour identical; md:min-h-0 hands height control
            to the card on desktop. */}
        <div
          className="min-h-screen md:min-h-0 md:h-full md:w-[430px] md:shrink-0 md:overflow-y-auto"
          style={{
            position: 'relative',
            background: colors.navy,
            fontFamily: 'system-ui, sans-serif',
            color: '#fff',
          }}
        >
          {/* Decorative wave. Absolute on desktop so it scrolls with the
              column rather than pinning to the viewport behind the card. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/vector.png"
            alt=""
            aria-hidden="true"
            className="fixed md:absolute"
            style={{
              zIndex: 0,
              top: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(100vw, 488px)',
              // The column scrolls, which makes its overflow-x auto too —
              // without this cap the wave would spill and add a horizontal
              // scrollbar inside the column.
              maxWidth: '100%',
              height: 'auto',
              opacity: 0.4,
              marginTop: 160,
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

        {/* ── Tutor illustration — desktop only ─────────────────────────
            Decorative: aria-hidden with an empty alt, since it carries no
            information a screen-reader user needs. */}
        <div className="hidden md:block md:flex-1 md:h-full bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/tutor.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
