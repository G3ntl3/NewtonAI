import Link from 'next/link';

/**
 * "Newton AI" wordmark. `dark` renders navy-on-white for screens that break
 * out of the navy auth background (e.g. the password-reset success screen);
 * default is the white-on-navy mark used everywhere else.
 */
export default function AuthLogo({ dark = false }) {
  return (
    <Link
      href="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vector.png"
        alt=""
        width={24}
        height={12}
        style={{ display: 'block', filter: dark ? 'brightness(0)' : 'none' }}
      />
      <span
        style={{
          color: dark ? '#03045E' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Newton AI
      </span>
    </Link>
  );
}
