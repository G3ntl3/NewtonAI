import { CheckIcon } from './icons';

/** Single learning goal row */
export default function GoalRow({ goal }) {
  const isDone = goal.status === 'done';
  return (
    <div className="flex items-start gap-3 py-3 border-b border-newton-bg/[0.06] last:border-0">
      {/* Status checkbox (square) */}
      <div
        className={`
          w-5 h-5 rounded-[5px] shrink-0 mt-0.5 flex items-center justify-center
          transition-colors
          ${isDone
            ? 'bg-newton-green text-white'
            : 'border-2 border-newton-bg/20'}
        `}
      >
        {isDone && <CheckIcon className="w-3 h-3" />}
      </div>

      {/* Text + bar */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium leading-snug mb-2 ${
            isDone ? 'text-newton-bg/40 line-through' : 'text-newton-bg'
          }`}
        >
          {goal.text}
        </p>
        <div className="h-1 bg-newton-bg/[0.08] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full progress-fill ${
              isDone ? 'bg-newton-green' : 'bg-newton-blue-mid'
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Due day / done label + fraction */}
      <div className="text-right shrink-0">
        <span
          className={`text-[11px] font-semibold ${isDone ? 'text-newton-green' : 'text-newton-orange'}`}
        >
          {goal.dueLabel}
        </span>
        {goal.count && (
          <p className="text-newton-bg/40 text-[10px] mt-1">{goal.count}</p>
        )}
      </div>
    </div>
  );
}
