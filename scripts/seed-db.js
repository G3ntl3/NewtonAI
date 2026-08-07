/**
 * seed-db.js
 * Seeds MongoDB with a demo school, one user per role, a student recovery
 * code, and sample dashboard data (subjects, topics, mastery, study
 * sessions, goals, bookmarks, flashcards, analytics) for the demo student.
 *
 * Usage (from repo root):
 *   npm run seed
 */
import bcrypt from 'bcryptjs';
import { connect } from '../packages/database/src/connection.js';
import { SchoolRepository } from '../packages/database/src/repositories/SchoolRepository.js';
import { UserRepository } from '../packages/database/src/repositories/UserRepository.js';
import { SubjectRepository } from '../packages/database/src/repositories/SubjectRepository.js';
import { TopicRepository } from '../packages/database/src/repositories/TopicRepository.js';
import { MasteryRepository } from '../packages/database/src/repositories/MasteryRepository.js';
import { StudySessionRepository } from '../packages/database/src/repositories/StudySessionRepository.js';
import { GoalRepository } from '../packages/database/src/repositories/GoalRepository.js';
import { BookmarkRepository } from '../packages/database/src/repositories/BookmarkRepository.js';
import { FlashcardRepository } from '../packages/database/src/repositories/FlashcardRepository.js';
import { AnalyticsRepository } from '../packages/database/src/repositories/AnalyticsRepository.js';
import { createSession, deleteAllForUser as deleteAllSessionsForUser } from '../packages/database/src/repositories/sessionRepo.js';
import { issueRecoveryCode } from '../packages/auth/src/recovery-codes/generateRecoveryCode.js';
import { ROLES } from '../packages/auth/src/rbac/roles.js';

const DEFAULT_PASSWORD = 'Password123!';

const USERS = [
  {
    email: 'student@newton.ai',
    phoneNumber: '+2348010000001',
    role: ROLES.STUDENT,
    fullName: 'Demo Ada Student',
    schoolName: 'Newton Demo Academy',
  },
  {
    email: 'teacher@newton.ai',
    role: ROLES.TEACHER,
    fullName: 'Demo Bea Teacher',
    schoolName: 'Newton Demo Academy',
  },
  {
    email: 'parent@newton.ai',
    role: ROLES.PARENT,
    fullName: 'Demo Cal Parent',
    schoolName: 'Newton Demo Academy',
  },
  {
    email: 'admin@newton.ai',
    role: ROLES.SCHOOL_ADMIN,
    fullName: 'Demo Dan Admin',
    schoolName: 'Newton Demo Academy',
  },
  {
    email: 'superadmin@newton.ai',
    role: ROLES.SUPER_ADMIN,
    fullName: 'Demo Eve Super',
    schoolName: 'Newton Demo Academy',
  },
];

const SUBJECTS = [
  {
    slug: 'physics',
    name: 'Physics',
    icon: 'zap',
    level: 'SSS 2',
    topics: [
      "Newton's First Law",
      "Newton's Second Law",
      "Newton's Third Law",
      'Vectors and Scalars',
      'Motion in a Straight Line',
      'Projectile Motion',
      'Work and Energy',
      'Momentum',
      'Circular Motion',
      'Gravitation',
      'Simple Harmonic Motion',
      'Waves',
    ],
    // Completed topics for the demo student — deliberately excludes
    // "Newton's Second Law", which is seeded as in-progress below.
    completed: [
      "Newton's First Law",
      "Newton's Third Law",
      'Vectors and Scalars',
      'Motion in a Straight Line',
      'Work and Energy',
      'Momentum',
      'Circular Motion',
    ],
    inProgress: "Newton's Second Law",
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-conical',
    level: 'SSS 2',
    topics: [
      'Atomic Structure',
      'Periodic Table',
      'Chemical Bonding',
      'Stoichiometry',
      'Acid-Base Titration',
      'Equivalence Point',
      'Redox Reactions',
      'Electrochemistry',
      'Organic Chemistry Basics',
      'Hydrocarbons',
      'Rates of Reaction',
      'Chemical Equilibrium',
      'Thermochemistry',
      'Gas Laws',
    ],
    completed: [
      'Atomic Structure',
      'Periodic Table',
      'Chemical Bonding',
      'Stoichiometry',
      'Gas Laws',
    ],
  },
  {
    slug: 'biology',
    name: 'Biology',
    icon: 'dna',
    level: 'SSS 2',
    topics: [
      'Cell Structure',
      'Cell Division',
      'Photosynthesis',
      'Respiration',
      'Genetics',
      'Evolution',
      'Ecology',
      'Human Digestive System',
      'Human Circulatory System',
      'Human Respiratory System',
      'Human Nervous System',
      'Reproduction',
      'Classification of Organisms',
      'Nutrition',
      'Excretion',
      'Homeostasis',
    ],
    completed: ['Cell Structure', 'Cell Division', 'Photosynthesis', 'Respiration'],
  },
];

// Last 6 days' study minutes (today first), sized so this week totals 5h24m —
// mirrors the dashboard mockup's numbers regardless of which weekday "today" is.
const RECENT_STUDY_MINUTES = [48, 72, 30, 96, 54, 24];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  return startOfDay(new Date(Date.now() - n * 24 * 60 * 60 * 1000));
}

/** Next occurrence of `targetDow` (0=Sun..6=Sat), today counts if it matches. */
function nextWeekday(targetDow) {
  const today = startOfDay(new Date());
  const diff = (targetDow - today.getDay() + 7) % 7;
  return new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
}

async function seedSubjectsAndMastery(studentId) {
  const bySlug = {};

  for (let subjIndex = 0; subjIndex < SUBJECTS.length; subjIndex += 1) {
    const subj = SUBJECTS[subjIndex];
    const subject = await SubjectRepository.upsertBySlug(subj.slug, {
      name: subj.name,
      slug: subj.slug,
      icon: subj.icon,
      order: subjIndex,
    });
    bySlug[subj.slug] = subject;

    const topicDocs = {};
    for (let i = 0; i < subj.topics.length; i += 1) {
      const topic = await TopicRepository.upsertByName(subject._id, subj.topics[i], {
        subjectId: subject._id,
        name: subj.topics[i],
        level: subj.level,
        order: i,
      });
      topicDocs[subj.topics[i]] = topic;
    }

    for (const name of subj.completed) {
      const topic = topicDocs[name];
      await MasteryRepository.upsert(studentId, topic._id, {
        userId: studentId,
        topicId: topic._id,
        subjectId: subject._id,
        masteryPercent: 100,
        completed: true,
        lastStudiedAt: daysAgo(7),
      });
    }

    if (subj.inProgress) {
      const topic = topicDocs[subj.inProgress];
      const lastStudiedAt = daysAgo(1);
      lastStudiedAt.setHours(19, 40, 0, 0); // "Yesterday, 7:40 pm"
      await MasteryRepository.upsert(studentId, topic._id, {
        userId: studentId,
        topicId: topic._id,
        subjectId: subject._id,
        masteryPercent: 68,
        completed: false,
        lastStudiedAt,
      });
    }
  }

  return bySlug;
}

async function seedStudySessions(studentId) {
  await StudySessionRepository.deleteAllForUser(studentId); // re-runnable: minutes shouldn't stack
  for (let i = 0; i < RECENT_STUDY_MINUTES.length; i += 1) {
    await StudySessionRepository.addMinutes(studentId, daysAgo(i), RECENT_STUDY_MINUTES[i]);
  }
}

async function seedGoals(studentId) {
  await GoalRepository.deleteAllForUser(studentId); // re-runnable: don't duplicate on re-seed

  await GoalRepository.create({
    userId: studentId,
    text: "Finish Newton's laws before Friday's test",
    targetCount: 5,
    currentCount: 3,
    dueAt: nextWeekday(5), // Friday
    status: 'in_progress',
  });

  await GoalRepository.create({
    userId: studentId,
    text: 'Run two chemistry practicals this week',
    targetCount: 2,
    currentCount: 1,
    dueAt: nextWeekday(0), // Sunday
    status: 'in_progress',
  });

  await GoalRepository.create({
    userId: studentId,
    text: 'Clear all overdue flashcards',
    targetCount: 6,
    currentCount: 6,
    status: 'done',
  });
}

async function seedBookmarks(studentId, subjectsBySlug) {
  await BookmarkRepository.deleteAllForUser(studentId); // re-runnable: don't duplicate on re-seed

  await BookmarkRepository.create({
    userId: studentId,
    subjectId: subjectsBySlug.physics._id,
    title: "Newton's Second Law — force, mass, acceleration",
    sourceType: 'chat',
    createdAt: daysAgo(2),
  });

  await BookmarkRepository.create({
    userId: studentId,
    subjectId: subjectsBySlug.chemistry._id,
    title: 'Endpoint is not the equivalence point',
    sourceType: 'chat',
    createdAt: daysAgo(5),
  });
}

async function seedFlashcards(studentId, subjectsBySlug) {
  await FlashcardRepository.deleteAllForUser(studentId); // re-runnable: don't duplicate on re-seed

  await FlashcardRepository.create({
    userId: studentId,
    subjectId: subjectsBySlug.physics._id,
    question: "State Newton's second law in words.",
    answer: 'The rate of change of momentum is proportional to the applied force and occurs in the direction of that force.',
    seenCount: 4,
    dueAt: new Date(),
    bookmarked: false,
  });

  await FlashcardRepository.create({
    userId: studentId,
    subjectId: subjectsBySlug.chemistry._id,
    question: 'Endpoint vs equivalence point?',
    answer: 'The equivalence point is where moles of acid equal moles of base; the endpoint is where the indicator visibly changes color, and the two are rarely exactly the same.',
    seenCount: 2,
    dueAt: new Date(),
    bookmarked: true,
  });
}

// The chat route (apps/student-web/src/app/api/chat/route.js) needs a
// Session document to load before it can hold a tutoring turn — this gives
// the demo student one, on the same in-progress topic already seeded above.
const DEMO_SESSION_ID = 'demo-physics-newtons-second-law';

async function seedChatSession(studentId) {
  await deleteAllSessionsForUser(studentId); // re-runnable: don't duplicate on re-seed
  await createSession({
    sessionId: DEMO_SESSION_ID,
    userId: studentId,
    subject: 'physics',
    concept: {
      title: "Newton's Second Law",
      objective:
        'Understand that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F = ma).',
    },
  });
}

async function seedAnalytics(studentId) {
  await AnalyticsRepository.upsertForUser(studentId, {
    quizAccuracy: 68,
    quizAccuracyDelta: 6,
    questionsAsked: 112,
    questionsAskedDelta: 11,
    practicalsRun: 7,
    practicalsRunDelta: 2,
  });
}

async function main() {
  await connect();

  const school = await SchoolRepository.upsertByName('Newton Demo Academy', {
    name: 'Newton Demo Academy',
    countryCode: 'NG',
    curriculumId: 'NG-WAEC',
    isActive: true,
  });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const seeded = [];

  for (const entry of USERS) {
    const user = await UserRepository.upsertByEmail(entry.email, {
      email: entry.email,
      phoneNumber: entry.phoneNumber,
      passwordHash,
      role: entry.role,
      fullName: entry.fullName,
      name: entry.fullName,
      schoolName: entry.schoolName,
      schoolId: school._id,
      isActive: true,
    });
    seeded.push(user);
  }

  const student = seeded.find((u) => u.role === ROLES.STUDENT);
  const { code, expiresAt } = await issueRecoveryCode(student._id, { neverExpires: true });

  console.log('Seeding dashboard sample data for the demo student…');
  const subjectsBySlug = await seedSubjectsAndMastery(student._id);
  await seedStudySessions(student._id);
  await seedGoals(student._id);
  await seedBookmarks(student._id, subjectsBySlug);
  await seedFlashcards(student._id, subjectsBySlug);
  await seedChatSession(student._id);
  await seedAnalytics(student._id);

  console.log('\nNewton AI seed complete.\n');
  console.log('School:', school.name, `(${school._id})`);
  console.log('\nTest users — log in with full name + password (password for all: Password123!):');
  for (const u of seeded) {
    console.log(`  - ${u.role.padEnd(14)} ${u.fullName || u.name}`);
  }
  console.log('\nDemo chat session (POST /api/chat body: { sessionId, message }):');
  console.log(`  sessionId: ${DEMO_SESSION_ID}`);
  console.log('\nStudent recovery code (reset at /reset-password):');
  console.log(`  code: ${code}`);
  console.log(`  expires: ${expiresAt ? expiresAt.toISOString() : 'never'}`);
  console.log('\nStudent-web: http://localhost:3000/signup');
  console.log('Login: http://localhost:3000/login\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
