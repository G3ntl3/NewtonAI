import Link from 'next/link';
import { ChevronRightIcon } from './icons';

/**
 * ComingSoon
 * Shared placeholder for dashboard routes that are navigable but not built
 * yet. These pages previously returned null, so tapping them from the
 * sidebar or a "See all" link landed the student on a blank screen with no
 * explanation and no way back — indistinguishable from a broken app.
 *
 * Reuses the Lab's coming-soon badge styling so unbuilt things look the same
 * wherever they appear.
 */
export default function ComingSoon({ title, description, icon }) {
  return (
    <div className="animate-fade-in bg-white min-h-full px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-newton-blue-mid/10 flex items-center justify-center mx-auto mb-5">
          {icon}
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-newton-bg font-bold text-xl">{title}</h1>
          <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-newton-bg/[0.08] text-newton-bg/45 whitespace-nowrap">
            Coming soon
          </span>
        </div>

        <p className="text-newton-bg/50 text-sm leading-relaxed">{description}</p>

        <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/chat"
            className="px-5 py-2.5 rounded-xl bg-newton-blue-mid hover:bg-newton-blue-bright text-white text-sm font-semibold transition-colors"
          >
            Ask Newton something
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-newton-bg/15 text-newton-bg/70 hover:bg-newton-bg/[0.04] text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1"
          >
            Back to dashboard
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
