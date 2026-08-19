'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Flame, Clock, Star, Award, Database, Bell, Shield, Download, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { fetchMe, logout } from '@/lib/authApi';
import { fetchDashboardSummary } from '@/lib/dashboardApi';
import { fetchProfile } from '@/lib/profileApi';
import { fetchFlashcards } from '@/lib/flashcardApi';
import { useSessionStore } from '@/stores/sessionStore';
import { CardsIcon, SUBJECT_ICON_MAP, BookIcon } from '@/components/dashboard/icons';

const TABS = ['Progress', 'Saved', 'Settings'];
const LANGUAGES = ['English', 'Pidgin', 'Hausa', 'Igbo', 'Yorùbá'];

function StatTile({ icon, value, label }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2.5 flex-1 min-w-0">
      {icon}
      <p className="text-white font-bold text-base leading-none mt-1.5 truncate">{value}</p>
      <p className="text-white/50 text-[9px] font-semibold uppercase tracking-wide mt-1 truncate">{label}</p>
    </div>
  );
}

function ToggleRow({ icon, label, hint, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-newton-blue-mid/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-newton-bg text-sm font-medium">{label}</p>
        <p className="text-newton-bg/40 text-[11px] mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`w-10 h-6 p-0 rounded-full shrink-0 transition-colors relative ${checked ? 'bg-newton-blue-mid' : 'bg-newton-bg/15'}`}
      >
        {/* left-0 is load-bearing: without it the knob resolves its static
            position inside the button's default UA padding, so it sat
            off-centre and overflowed the track when switched on. */}
        <span
          className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

/** Static row — feature doesn't exist yet, kept visually inert (not a fake button). */
function AccountRow({ icon, label }) {
  return (
    <div className="flex items-center gap-3 py-3 text-newton-bg/35">
      {icon}
      <span className="text-sm font-medium flex-1">{label}</span>
      <ChevronRight className="w-4 h-4" />
    </div>
  );
}

/** "Saved" tab — flashcards grouped by the subject they were saved under (see labCatalog-style attribution: packages/database Subject collection). */
function SavedFlashcards({ flashcards, router }) {
  if (flashcards.length === 0) {
    return <p className="text-newton-bg/40 text-xs text-center py-10">No flashcards saved yet — add one from a chat.</p>;
  }

  const groups = new Map();
  for (const card of flashcards) {
    const key = card.subject?.name ?? 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }

  return (
    <div className="px-4 md:px-8 py-5 space-y-6">
      {Array.from(groups.entries()).map(([subjectName, cards]) => {
        const SubjectIcon = (cards[0].subject && SUBJECT_ICON_MAP[cards[0].subject.icon]) || BookIcon;
        return (
          <section key={subjectName}>
            <h2 className="text-newton-bg font-bold text-sm mb-2 flex items-center gap-2">
              <SubjectIcon className="w-4 h-4 text-newton-blue-mid" />
              {subjectName}
              <span className="text-newton-bg/35 font-normal">({cards.length})</span>
            </h2>
            <div className="divide-y divide-newton-bg/[0.06]">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => router.push(`/flashcards?start=${card.id}`)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:opacity-70 transition-opacity"
                >
                  <CardsIcon className="w-4 h-4 text-newton-bg/35 shrink-0" />
                  <span className="text-newton-bg text-sm flex-1 truncate">{card.question}</span>
                  <ChevronRight className="w-4 h-4 text-newton-bg/25 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, clearSession } = useSessionStore();
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState('Settings');
  const [language, setLanguage] = useState('English');
  const [toggles, setToggles] = useState({ dataSaver: true, offlineLessons: false, studyNudge: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { ok, data } = await fetchMe();
      if (cancelled) return;
      if (!ok) {
        clearSession();
        router.replace('/login');
        return;
      }
      setUser(data.user);

      const [profileRes, dashboardRes, flashcardsRes] = await Promise.all([
        fetchProfile(),
        fetchDashboardSummary(),
        fetchFlashcards(),
      ]);
      if (cancelled) return;
      if (profileRes.ok) setProfile(profileRes.data.data);
      if (dashboardRes.ok) setStreak(dashboardRes.data.data.streak);
      if (flashcardsRes.ok) setFlashcards(flashcardsRes.data.data);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clearSession, router, setUser]);

  // Guarded so a double-tap can't fire two sign-out requests; also drives
  // the spinner, since the redirect can take a moment on a slow connection.
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      clearSession();
      router.replace('/login');
    } catch {
      // Sign-out failed (offline, server error) — let them try again rather
      // than leaving the row spinning forever.
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-full border-2 border-newton-blue-mid border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.nickname || user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="animate-fade-in min-h-full bg-white pb-6">
      {/* ── Dark profile header ─────────────────────────── */}
      <div className="bg-newton-bg px-4 md:px-8 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-newton-blue-mid/30 border-2 border-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.pictureUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight truncate">{displayName}</h1>
            {user?.schoolName && (
              <p className="text-white/60 text-xs mt-0.5 truncate">{user.schoolName}</p>
            )}
            {/* Badge is static/decorative — no gamification system exists yet. */}
            <span className="inline-block mt-1.5 bg-newton-orange/20 text-newton-orange text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
              Rising Star
            </span>
          </div>
          <button
            type="button"
            aria-label="Edit profile"
            onClick={() => router.push('/profile/edit')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stats — streak/hours are real; points/rank are static placeholders. */}
        <div className="flex gap-2 mt-5">
          <StatTile
            icon={<Flame className="w-4 h-4 text-newton-orange" />}
            value={`${streak?.days ?? 0}d`}
            label="Streak"
          />
          <StatTile
            icon={<Clock className="w-4 h-4 text-newton-cyan-light" />}
            value={`${streak?.totalHours ?? 0}h ${streak?.totalMins ?? 0}m`}
            label="This week"
          />
          <StatTile icon={<Star className="w-4 h-4 text-newton-cyan-light" />} value="—" label="Points" />
          <StatTile icon={<Award className="w-4 h-4 text-newton-cyan-light" />} value="—" label="In class" />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="px-4 md:px-8 pt-4">
        <div className="flex items-center gap-1 bg-newton-bg/[0.04] rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                activeTab === tab ? 'bg-white text-newton-bg shadow-sm' : 'text-newton-bg/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Progress' && (
        <p className="text-newton-bg/40 text-xs text-center py-10">Nothing here yet.</p>
      )}

      {activeTab === 'Saved' && (
        <SavedFlashcards flashcards={flashcards} router={router} />
      )}

      {activeTab === 'Settings' && (
        <div className="px-4 md:px-8 py-5 space-y-6">
          {/* Data & access — visual only, not persisted (not a priority yet). */}
          <section>
            <h2 className="text-newton-bg font-bold text-sm mb-1">Data and access</h2>
            <div className="divide-y divide-newton-bg/[0.06]">
              <ToggleRow
                icon={<Database className="w-4 h-4 text-newton-blue-mid" />}
                label="Data saver"
                hint="Skip animations and heavy assets on mobile data"
                checked={toggles.dataSaver}
                onChange={() => setToggles((t) => ({ ...t, dataSaver: !t.dataSaver }))}
              />
              <ToggleRow
                icon={<Download className="w-4 h-4 text-newton-blue-mid" />}
                label="Keep lessons offline"
                hint="Store this week's topics on the device"
                checked={toggles.offlineLessons}
                onChange={() => setToggles((t) => ({ ...t, offlineLessons: !t.offlineLessons }))}
              />
              <ToggleRow
                icon={<Bell className="w-4 h-4 text-newton-blue-mid" />}
                label="Daily study nudge"
                hint="One reminder at 6pm, never more"
                checked={toggles.studyNudge}
                onChange={() => setToggles((t) => ({ ...t, studyNudge: !t.studyNudge }))}
              />
            </div>
          </section>

          {/* Explanation language — visual only; doesn't change tutor behavior yet. */}
          <section>
            <h2 className="text-newton-bg font-bold text-sm mb-1">Explanation language</h2>
            <p className="text-newton-bg/40 text-[11px] mb-3">
              Newton explains in English; question wording stays in exam English.
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    language === lang
                      ? 'bg-newton-bg text-white border-newton-bg'
                      : 'bg-white text-newton-bg/60 border-newton-bg/15 hover:border-newton-bg/30'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-newton-bg font-bold text-sm mb-1">Account</h2>
            <div className="divide-y divide-newton-bg/[0.06]">
              <AccountRow icon={<Shield className="w-4 h-4" />} label="Guardian access" />
              <AccountRow icon={<Download className="w-4 h-4" />} label="Download my notes" />
              <AccountRow icon={<HelpCircle className="w-4 h-4" />} label="Help and feedback" />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className="w-full flex items-center gap-3 py-3 text-left disabled:cursor-wait"
              >
                {signingOut ? (
                  <span
                    className="block w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin shrink-0"
                    role="status"
                  />
                ) : (
                  <LogOut className="w-4 h-4 text-red-500" />
                )}
                <span className="text-red-500 text-sm font-medium flex-1">
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
