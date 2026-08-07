'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/authApi';
import { useSessionStore } from '@/stores/sessionStore';
import {
  HomeIcon,
  BookIcon,
  CardsIcon,
  TargetIcon,
  BookmarkIcon,
  ChartIcon,
  ChatIcon,
  TrophyIcon,
  FlaskIcon,
  LogOutIcon,
} from './icons';

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',    Icon: HomeIcon },
  { href: '/subjects',      label: 'Subjects',     Icon: BookIcon },
  { href: '/flashcards',    label: 'Flashcards',   Icon: CardsIcon },
  { href: '/goals',         label: 'Goals',        Icon: TargetIcon },
  { href: '/bookmarks',     label: 'Bookmarks',    Icon: BookmarkIcon },
  { href: '/progress',      label: 'Progress',     Icon: ChartIcon },
  { href: '/chat',          label: 'Chat',         Icon: ChatIcon },
  { href: '/achievements',  label: 'Achievements', Icon: TrophyIcon },
  { href: '/lab',           label: 'Lab',          Icon: FlaskIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useSessionStore();

  const displayName =
    user?.fullName?.split(' ')[0] ||
    user?.name?.split(' ')[0] ||
    'Tolu';
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleLogout() {
    await logout();
    clearSession();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-newton-navy border-r border-white/[0.06] shrink-0 fixed left-0 top-0 bottom-0 z-30">
      {/* ── Logo ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="Newton AI"
          className="w-9 h-9 rounded-xl shadow-lg shadow-newton-cyan/20 shrink-0"
        />
        <div>
          <p className="text-newton-cyan-ghost font-bold text-sm leading-none">Newton AI</p>
          <p className="text-newton-cyan-lighter text-[11px] mt-0.5">Student Portal</p>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, Icon: NavIcon }) => {
          const isActive =
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-newton-blue-mid text-newton-cyan-ghost shadow-sm shadow-newton-blue-mid/40'
                  : 'text-newton-cyan-pale hover:bg-white/[0.05] hover:text-newton-cyan-ghost'}
              `}
            >
              <NavIcon
                className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                  isActive
                    ? 'text-newton-cyan'
                    : 'text-newton-cyan-lighter group-hover:text-newton-cyan'
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User / Sign out ─────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-all group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-newton-blue-mid to-newton-cyan flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p className="text-newton-cyan-ghost text-sm font-semibold truncate leading-none">
              {displayName}
            </p>
            <p className="text-newton-cyan-lighter text-[11px] mt-0.5">Student</p>
          </div>
          {/* Log out */}
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-newton-cyan-lighter hover:text-newton-cyan transition-colors shrink-0"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
