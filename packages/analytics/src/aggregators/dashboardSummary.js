import { connect } from '@newton/database/src/connection.js';
import { SubjectRepository } from '@newton/database/src/repositories/SubjectRepository.js';
import { TopicRepository } from '@newton/database/src/repositories/TopicRepository.js';
import { MasteryRepository } from '@newton/database/src/repositories/MasteryRepository.js';
import { StudySessionRepository } from '@newton/database/src/repositories/StudySessionRepository.js';
import { GoalRepository } from '@newton/database/src/repositories/GoalRepository.js';
import { BookmarkRepository } from '@newton/database/src/repositories/BookmarkRepository.js';
import { FlashcardRepository } from '@newton/database/src/repositories/FlashcardRepository.js';
import { AnalyticsRepository } from '@newton/database/src/repositories/AnalyticsRepository.js';

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

/** Consecutive-day streak ending today (or yesterday, if today has no session yet) + this week's bars. */
function computeStreakAndWeek(sessions) {
  const minutesByDay = new Map();
  for (const session of sessions) {
    const key = startOfDay(session.date).getTime();
    minutesByDay.set(key, (minutesByDay.get(key) || 0) + session.minutesStudied);
  }

  let streak = 0;
  let cursor = startOfDay(new Date());
  if (!minutesByDay.get(cursor.getTime())) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  while ((minutesByDay.get(cursor.getTime()) || 0) > 0) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  const today = startOfDay(new Date());
  const mondayOffset = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today.getTime() - mondayOffset * DAY_MS);

  let weekMinutes = 0;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday.getTime() + i * DAY_MS);
    const minutes = minutesByDay.get(day.getTime()) || 0;
    weekMinutes += minutes;
    return {
      label: WEEK_LABELS[i],
      value: Math.round((minutes / 60) * 10) / 10,
      today: day.getTime() === today.getTime(),
    };
  });

  return { streak, weekDays, weekMinutes };
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
  ]);

  const { streak, weekDays, weekMinutes } = computeStreakAndWeek(sessions);
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
