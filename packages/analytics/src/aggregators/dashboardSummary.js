import { connect } from '@newton/database/src/connection.js';
import { SubjectRepository } from '@newton/database/src/repositories/SubjectRepository.js';
import { TopicRepository } from '@newton/database/src/repositories/TopicRepository.js';
import { MasteryRepository } from '@newton/database/src/repositories/MasteryRepository.js';
import { StudySessionRepository } from '@newton/database/src/repositories/StudySessionRepository.js';
import { GoalRepository } from '@newton/database/src/repositories/GoalRepository.js';
import { BookmarkRepository } from '@newton/database/src/repositories/BookmarkRepository.js';
import { FlashcardRepository } from '@newton/database/src/repositories/FlashcardRepository.js';
import { AnalyticsRepository } from '@newton/database/src/repositories/AnalyticsRepository.js';
import { UserRepository } from '@newton/database/src/repositories/UserRepository.js';
import { watDateKey } from '@newton/database/src/streak.js';

const WEEKLY_GOAL_HOURS_DEFAULT = 6;
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DUE_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgoLabel(date) {
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatLastSeen(date) {
  const d = new Date(date);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const label = daysAgoLabel(d);
  if (label === 'today') return `Today, ${time}`;
  if (label === '1 day ago') return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

function signed(n) {
  const v = n || 0;
  return v >= 0 ? `+${v}` : `${v}`;
}

function subjectById(subjects, subjectId) {
  if (!subjectId) return null;
  return subjects.find((s) => String(s._id) === String(subjectId)) || null;
}

/**
 * How hard a day's studying was, as a bucket the UI can colour by.
 * Minute thresholds rather than a relative scale, so a light week doesn't
 * make a 10-minute day look like a peak effort just because it was the best
 * of a bad week — "hot" should mean genuinely hot.
 */
export const INTENSITY_THRESHOLDS = { light: 1, steady: 15, strong: 30, intense: 60 };

function intensityFor(minutes) {
  if (minutes < INTENSITY_THRESHOLDS.light) return 'none';
  if (minutes < INTENSITY_THRESHOLDS.steady) return 'light';
  if (minutes < INTENSITY_THRESHOLDS.strong) return 'steady';
  if (minutes < INTENSITY_THRESHOLDS.intense) return 'strong';
  return 'intense';
}

/**
 * This week's bars, bucketed by WAT day.
 *
 * Days are keyed by the 'YYYY-MM-DD' WAT key rather than the server's local
 * midnight: StudySession rows are written at WAT-day boundaries (see
 * watDayStart), and the server runs UTC in production but WAT locally, so
 * local startOfDay() would shift bars into the wrong column.
 *
 * The streak itself is NOT computed here any more — it is the persisted,
 * message-driven User.currentStreak (see getDashboardSummary).
 */
function computeWeek(sessions) {
  const minutesByDay = new Map();
  for (const session of sessions) {
    const key = watDateKey(session.date);
    minutesByDay.set(key, (minutesByDay.get(key) || 0) + session.minutesStudied);
  }

  const todayKey = watDateKey();
  const todayUtc = new Date(`${todayKey}T00:00:00.000Z`);
  // getUTCDay: 0 = Sunday. Shift so 0 = Monday, matching WEEK_LABELS.
  const mondayOffset = (todayUtc.getUTCDay() + 6) % 7;
  const monday = new Date(todayUtc.getTime() - mondayOffset * DAY_MS);

  let weekMinutes = 0;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday.getTime() + i * DAY_MS);
    const key = day.toISOString().slice(0, 10);
    const minutes = minutesByDay.get(key) || 0;
    weekMinutes += minutes;
    return {
      label: WEEK_LABELS[i],
      value: Math.round((minutes / 60) * 10) / 10,
      minutes,
      intensity: intensityFor(minutes),
      today: key === todayKey,
    };
  });

  return { weekDays, weekMinutes };
}

/**
 * Composes the student dashboard payload from across the data models.
 * This is the one place that fans out to every repository the dashboard
 * needs — API routes should call this rather than querying models directly.
 */
export async function getDashboardSummary(userId) {
  await connect();

  const [
    subjects,
    topicCountsBySubject,
    completedCountsBySubject,
    totalTopics,
    totalMasteredForUser,
    inProgress,
    goals,
    bookmarks,
    dueFlashcards,
    bookmarkedFlashcards,
    analytics,
    sessions,
    student,
  ] = await Promise.all([
    SubjectRepository.listAll(),
    TopicRepository.countsBySubject(),
    MasteryRepository.completedCountsBySubjectForUser(userId),
    TopicRepository.countAll(),
    MasteryRepository.countCompletedForUser(userId),
    MasteryRepository.findMostRecentInProgressForUser(userId),
    GoalRepository.findActiveForUser(userId, 5),
    BookmarkRepository.findRecentForUser(userId, 5),
    FlashcardRepository.findDueForUser(userId, 1),
    FlashcardRepository.findBookmarkedDueForUser(userId, 1),
    AnalyticsRepository.findByUser(userId),
    StudySessionRepository.findSinceForUser(userId, new Date(Date.now() - 30 * DAY_MS)),
    UserRepository.findById(userId),
  ]);

  // The STREAK NUMBER comes from the persisted, student-level streak that the
  // chat route maintains (User.currentStreak — see packages/database/
  // src/streak.js): any message on any day counts, evaluated in WAT.
  // The weekly bars come from StudySession minutes, written by that same
  // route and bucketed on the same WAT boundary, so the two agree.
  const { weekDays, weekMinutes } = computeWeek(sessions);
  const streak = student?.currentStreak ?? 0;
  const weeklyGoalHours = WEEKLY_GOAL_HOURS_DEFAULT;
  const weeklyGoalProgress = Math.min(100, Math.round((weekMinutes / 60 / weeklyGoalHours) * 100));

  const subjectTiles = subjects.map((s) => ({
    id: String(s._id),
    name: s.name,
    icon: s.icon,
    href: `/subjects/${s.slug}`,
    totalTopics: topicCountsBySubject[String(s._id)] || 0,
    completedTopics: completedCountsBySubject[String(s._id)] || 0,
  }));

  const resumeLesson = inProgress
    ? {
        subject: (inProgress.subjectId?.name || '').toUpperCase(),
        level: inProgress.topicId?.level || '',
        topic: inProgress.topicId?.name || '',
        lastSeen: inProgress.lastStudiedAt ? formatLastSeen(inProgress.lastStudiedAt) : '',
        progress: inProgress.masteryPercent || 0,
        bookmarked: false,
      }
    : null;

  const toTile = (f) => ({
    id: String(f._id),
    subject: subjectById(subjects, f.subjectId)?.name?.toUpperCase() || '',
    question: f.question,
    dueLabel: `Due today · seen ${f.seenCount} time${f.seenCount === 1 ? '' : 's'}`,
  });

  const learningGoals = goals.map((g) => ({
    id: String(g._id),
    text: g.text,
    progress: Math.min(100, Math.round((g.currentCount / g.targetCount) * 100)),
    status: g.status,
    count: `${g.currentCount} / ${g.targetCount}`,
    dueLabel: g.status === 'done' ? 'Done' : g.dueAt ? DUE_DAY_LABELS[new Date(g.dueAt).getDay()] : '',
  }));

  const bookmarkList = bookmarks.map((b) => ({
    id: String(b._id),
    subjectIcon: subjectById(subjects, b.subjectId)?.icon || 'bookmark',
    title: b.title,
    timeAgo: daysAgoLabel(b.createdAt),
  }));

  const acc = analytics || {};
  const insights = {
    quizAccuracy: { value: acc.quizAccuracy || 0, change: signed(acc.quizAccuracyDelta), unit: '%', label: 'Quiz accuracy' },
    questionsAsked: { value: acc.questionsAsked || 0, change: signed(acc.questionsAskedDelta), unit: '', label: 'Questions asked' },
    practicalsRun: { value: acc.practicalsRun || 0, change: signed(acc.practicalsRunDelta), unit: '', label: 'Practicals run' },
    topicsMastered: { value: totalMasteredForUser, total: totalTopics, unit: '', label: 'Topics mastered' },
  };

  return {
    streak: {
      days: streak,
      subtitle: streak > 0
        ? "You're on a roll — keep the streak alive."
        : 'Study today to start a new streak.',
      totalHours: Math.floor(weekMinutes / 60),
      totalMins: weekMinutes % 60,
      weeklyGoalHours,
      weeklyGoalProgress,
      weekDays,
    },
    resumeLesson,
    dailyLearning: { label: 'Develop STEM Mastery' },
    subjects: subjectTiles,
    flashcards: dueFlashcards.map(toTile),
    bookmarkCards: bookmarkedFlashcards.map(toTile),
    learningGoals,
    bookmarks: bookmarkList,
    insights,
  };
}

export default getDashboardSummary;
