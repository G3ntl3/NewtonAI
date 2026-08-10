'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, ChatIcon, FlaskIcon, UserIcon } from './icons';

// Uniform deep-blue scheme: active pill fills with the app's deep navy,
// inactive icons show in the primary blue accent — no per-tab colors.
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',    Icon: HomeIcon },
  { href: '/chat',      label: 'Chat',    Icon: ChatIcon },
  { href: '/lab',       label: 'Lab',     Icon: FlaskIcon },
  { href: '/profile',   label: 'Profile', Icon: UserIcon },
];

const iconColor = 'text-newton-blue-mid';
const activeBg = 'bg-newton-bg';
const activeClasses = 'text-white rounded-full pl-4 pr-5 py-2.5';
const inactiveClasses = 'hover:opacity-70 w-11 h-11 rounded-full';

/**
 * BottomNav — flush edge-to-edge mobile tab bar (bottom-0/left-0/right-0).
 * Hidden on md+ (desktop shows sidebar instead).
 * The active tab expands to show its label; inactive tabs are icon-only.
 * The Chat tab is a plain link to /chat — subject selection now happens on
 * the inline chat landing screen (ChatLanding), not a nav dropdown.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    // bg-white so the safe-bottom inset strip doesn't reveal the shell's
    // navy root as a blue band under the nav on gesture-bar phones.
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom bg-white"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-between gap-1 bg-white shadow-lg shadow-newton-bg/10 border-t border-newton-bg/[0.06] px-3 py-3">
        {NAV_ITEMS.map(({ href, label, Icon: NavIcon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-center gap-2 transition-all duration-150 ${isActive ? `${activeBg} ${activeClasses}` : `${iconColor} ${inactiveClasses}`}`}
              >
                <NavIcon className="w-5 h-5 shrink-0" />
                {isActive && (
                  <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
