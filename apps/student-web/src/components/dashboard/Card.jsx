/** Reusable white card surface */
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-newton-bg/[0.08] shadow-sm ${className}`}>
      {children}
    </div>
  );
}
