import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopNav from './TopNav';

/**
 * DashboardShell
 * ─────────────────────────────────────────────────────────────
 * Responsive layout wrapper for all (dashboard) routes.
 *
 * Mobile  : full-width scrollable main area + fixed BottomNav
 * Desktop : fixed left Sidebar (240px) + scrollable main area
 */
export default function DashboardShell({ children }) {
  return (
    <div className="flex min-h-screen bg-newton-bg">
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────── */}
      <Sidebar />

      {/* ── Main area ──────────────────────────────────────── */}
      {/*
       * min-w-0 is load-bearing: a flex item defaults to min-width:auto, so
       * this column would refuse to shrink below its widest min-content
       * (e.g. StreakCard's whitespace-nowrap goal label), pushing the whole
       * page past the viewport on mobile. min-w-0 lets it shrink to the
       * screen so inner truncate/overflow-x-auto rules can do their job.
       */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen md:ml-60">
        {/*
         * Desktop-only sticky top bar: brand, search, and the hamburger that
         * opens the shared menu. Mobile header lives inside each page (so it
         * can show a contextual greeting / page title), with BottomNav for
         * navigation.
         */}
        <TopNav />

        {/* ── Page content ─────────────────────────────────── */}
        {/* bg-white on mobile: the root is bg-newton-bg (navy) for the
            desktop sidebar/header, and without this the pb-24 gutter above
            the fixed BottomNav showed that navy as a stray blue band. */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10 bg-white md:bg-transparent">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ───────────── */}
      <BottomNav />
    </div>
  );
}
