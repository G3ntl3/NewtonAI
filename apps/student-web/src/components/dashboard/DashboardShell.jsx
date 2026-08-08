import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { SearchIcon, BellIcon } from './icons';

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
         * Desktop-only top header bar.
         * Mobile header lives inside each page (so it can show
         * contextual greeting / page title).
         */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-newton-bg/90 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <p className="text-newton-cyan-lighter text-xs tracking-wide uppercase">
              Newton AI · Student
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <label htmlFor="dashboard-search" className="sr-only">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-newton-cyan-lighter" />
              <input
                id="dashboard-search"
                type="search"
                placeholder="Search topics, subjects…"
                className="
                  pl-9 pr-4 py-2 text-sm rounded-xl
                  bg-newton-navy border border-white/[0.08]
                  text-newton-cyan-pale placeholder:text-newton-cyan-lighter
                  focus:outline-none focus:border-newton-blue-mid
                  w-56 transition-all
                "
              />
            </div>

            {/* Notification bell */}
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-xl bg-newton-navy border border-white/[0.08] flex items-center justify-center hover:border-newton-blue-mid transition-colors"
            >
              <BellIcon className="w-4 h-4 text-newton-cyan-lighter" />
            </button>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ───────────── */}
      <BottomNav />
    </div>
  );
}
