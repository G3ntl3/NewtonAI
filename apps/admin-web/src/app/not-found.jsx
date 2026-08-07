import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        color: '#1a2332',
      }}
    >
      <h1 style={{ margin: '8px 0', fontFamily: 'Georgia, serif', fontSize: 36 }}>404</h1>
      <p style={{ margin: '0 0 20px', color: '#5a6b7d' }}>This page could not be found.</p>
      <Link href="/login" style={{ color: '#1a4f7a', fontWeight: 600 }}>
        Back to sign in
      </Link>
    </main>
  );
}
