import Link from 'next/link';
import { SUBJECT_ICON_MAP, BookIcon } from './icons';

/** Individual subject card. `highlighted` subjects render in the dark-navy accent state. */
export default function SubjectCard({ subject, highlighted = false }) {
  const pct = Math.round((subject.completedTopics / subject.totalTopics) * 100);
  const SubjectIcon = SUBJECT_ICON_MAP[subject.icon] || BookIcon;

  return (
    <Link
      href={subject.href}
      className={`
        shrink-0 w-28 md:w-auto
        rounded-2xl p-3.5 flex flex-col gap-2
        border transition-all duration-150 group
        ${
          highlighted
            ? 'bg-newton-bg border-newton-bg hover:bg-newton-navy'
            : 'bg-white border-newton-bg/[0.08] hover:border-newton-blue-mid/40 shadow-sm'
        }
      `}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          highlighted
            ? 'bg-white/15'
            : 'bg-newton-blue-mid/10 group-hover:bg-newton-blue-mid/20'
        }`}
      >
        <SubjectIcon className={`w-4 h-4 ${highlighted ? 'text-white' : 'text-newton-blue-mid'}`} />
      </div>
      <p className={`font-semibold text-sm ${highlighted ? 'text-white' : 'text-newton-bg'}`}>
        {subject.name}
      </p>
      <p className={`text-[10px] ${highlighted ? 'text-white/60' : 'text-newton-bg/45'}`}>
        {subject.completedTopics} of {subject.totalTopics} topics
      </p>
      <div className={`h-1 rounded-full overflow-hidden ${highlighted ? 'bg-white/15' : 'bg-newton-bg/[0.08]'}`}>
        <div
          className={`h-full rounded-full progress-fill ${highlighted ? 'bg-newton-cyan' : 'bg-newton-blue-mid'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
