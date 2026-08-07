/** Full-screen dashboard loading state */
export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full border-2 border-newton-blue-mid border-t-transparent animate-spin" />
        <p className="text-newton-bg/50 text-sm">Loading your dashboard…</p>
      </div>
    </div>
  );
}
