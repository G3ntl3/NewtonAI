import Link from 'next/link';
import { SUBJECT_ICON_MAP, BookIcon, PlayIcon, ClockIcon } from '@/components/dashboard/icons';
import { SUBJECTS } from '@/lib/subjects';

const SUBJECT_LABEL = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label]));
const SUBJECT_ICON_KEY = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.icon]));

/**
 * ExperimentCard
 * Renders one Lab catalog entry (see lib/labCatalog.js). Live and
 * coming-soon cards are deliberately built as two visually distinct
 * branches here — never the same markup with a dimmed overlay — so a
 * student can never mistake one for the other, and a coming-soon card is
 * structurally not a link/button, not just disabled.
 *
 * Live cards navigate to /lab/[simulationId] (a real page, not a modal) —
 * ordinary Link navigation, so browser back/forward and deep-linking work.
 */
export default function ExperimentCard({ experiment }) {
  const { title, subject, estimatedTime, available, simulationId } = experiment;
  const SubjectIcon = SUBJECT_ICON_MAP[SUBJECT_ICON_KEY[subject]] || BookIcon;

  if (!available) {
    return (
      <div
        className="rounded-2xl p-4 flex flex-col gap-2.5 border border-newton-bg/[0.06] bg-newton-bg/[0.03] select-none"
        aria-disabled="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-newton-bg/[0.06] flex items-center justify-center">
            <SubjectIcon className="w-4 h-4 text-newton-bg/30" />
          </div>
          <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-newton-bg/[0.08] text-newton-bg/45 whitespace-nowrap">
            Coming soon
          </span>
        </div>
        <div>
          <p className="font-semibold text-sm text-newton-bg/40 leading-snug">{title}</p>
          <p className="text-xs text-newton-bg/30 mt-0.5">{SUBJECT_LABEL[subject]}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-newton-bg/30">
          <ClockIcon className="w-3 h-3 shrink-0" />
          {estimatedTime}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/lab/${simulationId}`}
      className="text-left rounded-2xl p-4 flex flex-col gap-2.5 border border-newton-bg/[0.08] bg-white shadow-sm hover:border-newton-blue-mid/40 hover:shadow-md transition-all duration-150 group"
    >
      <div className="w-10 h-10 rounded-xl bg-newton-blue-mid/10 flex items-center justify-center group-hover:bg-newton-blue-mid/20 transition-colors">
        <SubjectIcon className="w-4 h-4 text-newton-blue-mid" />
      </div>
      <div>
        <p className="font-semibold text-sm text-newton-bg leading-snug">{title}</p>
        <p className="text-xs text-newton-blue-mid mt-0.5">{SUBJECT_LABEL[subject]}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-newton-bg/45">
          <ClockIcon className="w-3 h-3 shrink-0" />
          {estimatedTime}
        </div>
        <div className="w-7 h-7 rounded-full bg-newton-bg flex items-center justify-center shrink-0">
          <PlayIcon className="w-3 h-3 text-white" />
        </div>
      </div>
    </Link>
  );
}
