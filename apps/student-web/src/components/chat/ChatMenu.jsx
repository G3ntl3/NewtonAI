'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchProfile } from '@/lib/profileApi';
import { logout } from '@/lib/authApi';
import {
  UserIcon,
  RepeatIcon,
  HistoryIcon,
  SettingsIcon,
  LifeBuoyIcon,
  LogOutIcon,
} from '@/components/dashboard/icons';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_NEWTON_SUPPORT_PHONE || '+234 800 111 2233';

/**
 * ChatMenu
 * Dropdown opened by the chat header's hamburger button. Change Subject,
 * Support, and Sign Out are real (reuse the existing subject-picker reset,
 * the SUPPORT_PHONE tel: pattern already used on the auth pages, and
 * /api/auth/logout). Chat History and Chat Settings have no backing page
 * anywhere in the app yet, so they render clearly disabled with a "Soon"
 * badge — same pattern as the Lab's coming-soon cards — rather than a
 * button that looks live and does nothing.
 */
export default function ChatMenu({ onClose, onChangeSubject }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then(({ ok, data }) => {
      if (!cancelled && ok) setProfile(data.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Guarded so a double-tap can't fire two sign-out requests; also drives
  // the spinner, since the redirect can take a moment on a slow connection.
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      router.push('/login');
    } catch {
      // Sign-out failed (offline, server error) — let them try again rather
      // than leaving the row spinning forever.
      setSigningOut(false);
    }
  }

  const displayName = profile?.nickname || profile?.fullName || 'Student';

  return (
    <>
      <div className="fixed mt-30 inset-0 z-40" onClick={onClose} />
      <div className="fixed right-4 md:right-8 top-16 z-50 w-72 bg-newton-bg rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-4 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.pictureUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-white/60" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{displayName}</p>
            <p className="text-white/50 text-xs truncate">{profile?.email ?? ''}</p>
          </div>
        </Link>

        <div className="py-2">
          {/* Chat-only action. The shell's TopNav reuses this menu on every
              dashboard route and has no subject to change, so it is omitted
              when no handler is supplied rather than rendering a button that
              would throw on click. */}
          {onChangeSubject && (
            <button
              type="button"
              onClick={() => {
                onChangeSubject();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 text-sm hover:bg-white/5 transition-colors"
            >
              <RepeatIcon className="w-4 h-4 text-white/50" />
              Change Subject
            </button>
          )}

          <div
            className="flex items-center gap-3 px-4 py-2.5 text-white/30 text-sm select-none"
            aria-disabled="true"
          >
            <HistoryIcon className="w-4 h-4 text-white/25" />
            Chat History
            <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/40 whitespace-nowrap">
              Soon
            </span>
          </div>

          <div
            className="flex items-center gap-3 px-4 py-2.5 text-white/30 text-sm select-none"
            aria-disabled="true"
          >
            <SettingsIcon className="w-4 h-4 text-white/25" />
            Chat Settings
            <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/40 whitespace-nowrap">
              Soon
            </span>
          </div>

          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`}
            className="flex items-center gap-3 px-4 py-2.5 text-white/90 text-sm hover:bg-white/5 transition-colors"
          >
            <LifeBuoyIcon className="w-4 h-4 text-white/50" />
            Support
          </a>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-busy={signingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-white/90 text-sm hover:bg-white/5 transition-colors disabled:cursor-wait"
          >
            {signingOut ? (
              <span
                className="block w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin shrink-0"
                role="status"
              />
            ) : (
              <LogOutIcon className="w-4 h-4 text-white/50" />
            )}
            {signingOut ? 'Signing Out…' : 'Sign Out'}
          </button>
        </div>
      </div>
    </>
  );
}
