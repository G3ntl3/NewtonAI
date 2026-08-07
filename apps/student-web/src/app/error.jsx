'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Something went wrong</h1>
      <p>{error?.message || 'Unexpected error occurred.'}</p>
      <button type="button" onClick={() => reset?.()}>
        Try again
      </button>
    </div>
  );
}
