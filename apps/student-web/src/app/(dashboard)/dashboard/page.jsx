'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMe } from '@/lib/authApi';
import { fetchDashboardSummary } from '@/lib/dashboardApi';
import { fetchProfile } from '@/lib/profileApi';
import { useSessionStore } from '@/stores/sessionStore';
import { BellIcon, PlusCircleIcon, BrainIcon, ChatIcon, FlaskIcon, BookIcon } from '@/components/dashboard/icons';
import Card from '@/components/dashboard/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import StreakCard from '@/components/dashboard/StreakCard';
import ResumeLessonCard from '@/components/dashboard/ResumeLessonCard';
import DailyLearningCard from '@/components/dashboard/DailyLearningCard';
import SubjectCard from '@/components/dashboard/SubjectCard';
import FlashcardTile from '@/components/dashboard/FlashcardTile';
import GoalRow from '@/components/dashboard/GoalRow';
import BookmarkListItem from '@/components/dashboard/BookmarkListItem';
import InsightTile from '@/components/dashboard/InsightTile';
import LoadingScreen from '@/components/dashboard/LoadingScreen';

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function subtitleFor(resumeLesson) {
  if (resumeLesson?.subject) {
    return `Welcome back — ${resumeLesson.subject.toLowerCase()} is waiting`;
  }
  return 'Ready to learn something new today?';
}

/** Small "nothing here yet" line for empty sections. */
function EmptyNote({ children }) {
  return <p className="text-newton-bg/40 text-xs px-1 py-2">{children}</p>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, clearSession } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [nickname, setNickname] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { ok, data: meRes } = await fetchMe();
      if (cancelled) return;
      if (!ok) {
        clearSession();
        router.replace('/login');
        return;
      }
      setUser(meRes.user);

      // Best-effort — a missing/failed profile fetch just falls back to fullName.
      const profileRes = await fetchProfile();
      if (cancelled) return;
      if (profileRes.ok) {
        setNickname(profileRes.data.data.nickname);
      }

      const { ok: summaryOk, data: summaryRes } = await fetchDashboardSummary();
      if (cancelled) return;
      if (!summaryOk) {
        setError(summaryRes.error || 'Could not load dashboard');
        setLoading(false);
        return;
      }

      setData(summaryRes.data);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) {
        setError('Could not load dashboard');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [clearSession, router, setUser]);

  if (loading) return <LoadingScreen />;

  if (!data) {
    return (
      <div className="px-4 md:px-8 py-10">
        <p role="alert" className="text-red-400 text-sm text-center">
          {error || 'Could not load dashboard'}
        </p>
      </div>
    );
  }

  const displayName = nickname || user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
  const greeting = greetingForNow();
  const subtitle = subtitleFor(data.resumeLesson);

  const { insights } = data;
  const insightTiles = [
    { stat: insights.quizAccuracy,   icon: BrainIcon },
    { stat: insights.questionsAsked, icon: ChatIcon },
    { stat: insights.practicalsRun,  icon: FlaskIcon },
    { stat: insights.topicsMastered, icon: BookIcon },
  ];

  return (
    <div className="animate-fade-in bg-white min-h-full">
      {/* ── Mobile-only top header ───────────────────────── */}
      <header className="md:hidden flex items-start justify-between px-4 pt-6 pb-2">
        <div>
          <p className="text-newton-bg/50 text-xs">{greeting},</p>
          <h1 className="text-newton-bg font-bold text-[26px] leading-tight mt-0.5">
            {displayName}
          </h1>
          <p className="text-newton-bg/50 text-xs mt-1">{subtitle}</p>
        </div>
        <button
          aria-label="Notifications"
          className="w-9 h-9 mt-1 rounded-full bg-newton-bg flex items-center justify-center hover:bg-newton-navy transition-colors"
        >
          <BellIcon className="w-4 h-4 text-white" />
        </button>
      </header>

      {/* ── Desktop page title ───────────────────────────── */}
      <div className="hidden md:block px-8 pt-6 pb-2">
        <h1 className="text-newton-bg font-bold text-2xl">
          {greeting}, {displayName}
        </h1>
        <p className="text-newton-bg/50 text-sm mt-1">{subtitle}</p>
      </div>

      {/* ── Content ─────────────────────────────────────────
           Mobile:  single-column flex stack
           Desktop: structured multi-row grid sections
      ──────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 mt-4 space-y-5">

        {/* ROW 1 — Streak | Resume | Daily Learning */}
        <section aria-label="Overview" className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-5">
          <StreakCard data={data.streak} />

          {/* Mobile section label (hidden on desktop) */}
          <div className="md:hidden -mb-1">
            <p className="text-newton-cyan-ghost font-semibold text-sm">
              Pick up where you stopped
            </p>
          </div>

          {data.resumeLesson ? (
            <ResumeLessonCard data={data.resumeLesson} />
          ) : (
            <Card className="p-4 flex items-center justify-center">
              <EmptyNote>No lesson in progress yet — start one from Subjects.</EmptyNote>
            </Card>
          )}
          <DailyLearningCard data={data.dailyLearning} />
        </section>

        {/* ROW 2 — Subjects */}
        <section aria-label="Subjects">
          <SectionHeader title="Subjects" href="/subjects" />
          {data.subjects.length === 0 ? (
            <EmptyNote>No subjects assigned yet.</EmptyNote>
          ) : (
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-3 scroll-snap-x">
              {data.subjects.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  highlighted={Boolean(data.resumeLesson) && s.name.toUpperCase() === data.resumeLesson.subject}
                />
              ))}
            </div>
          )}
        </section>

        {/* ROW 3 — Flashcards | Learning Goals */}
        <section aria-label="Flashcards and goals" className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5">
          {/* Left: Flashcards. (A second "Bookmarks" block used to sit here
              showing data.bookmarkCards — bookmarked FLASHCARDS, not chats.
              Sharing the "Bookmarks" title with the real chat-bookmarks list
              in ROW 4 read as a duplicate section, so it was removed.) */}
          <div>
            <SectionHeader title="Flashcards" href="/flashcards" />
            {data.flashcards.length === 0 ? (
              <EmptyNote>Nothing due.</EmptyNote>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.flashcards.map((c) => <FlashcardTile key={c.id} card={c} />)}
              </div>
            )}
          </div>

          {/* Right: Learning Goals */}
          <div>
            <SectionHeader title="Learning goals" href="/goals" />
            <Card className="px-4 pt-1 pb-3">
              {data.learningGoals.length === 0 ? (
                <EmptyNote>No active goals yet.</EmptyNote>
              ) : (
                data.learningGoals.map((g) => <GoalRow key={g.id} goal={g} />)
              )}
              <button className="mt-3 flex items-center gap-1.5 text-newton-blue-mid hover:text-newton-blue-bright text-xs font-medium transition-colors">
                <PlusCircleIcon className="w-4 h-4" />
                Set a new goal
              </button>
            </Card>
          </div>
        </section>

        {/* ROW 4 — Bookmarks list | Insights */}
        <section aria-label="Bookmarks and insights" className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5">
          {/* Bookmarks list */}
          <div>
            <SectionHeader title="Bookmarks" href="/bookmarks" />
            <Card className="px-4 pt-1 pb-2">
              {data.bookmarks.length === 0 ? (
                <EmptyNote>No bookmarks saved yet.</EmptyNote>
              ) : (
                data.bookmarks.map((b) => <BookmarkListItem key={b.id} bookmark={b} />)
              )}
            </Card>
          </div>

          {/* Insights 2 × 2 */}
          <div>
            <SectionHeader title="Insights" href="/progress" linkText="Full progress" />
            <div className="grid grid-cols-2 gap-3">
              {insightTiles.map(({ stat, icon }) => (
                <InsightTile key={stat.label} stat={stat} icon={icon} />
              ))}
            </div>
          </div>
        </section>

        {/* Error state (data loaded once, then a later refresh failed) */}
        {error && (
          <p role="alert" className="text-red-400 text-sm text-center pb-4">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
