import Card from './Card';
import { FlameIcon, FlagIcon } from './icons';

/**
 * Heat scale for the weekly bars — cool for a light day through to red for a
 * heavy one. Buckets are decided server-side from real minutes studied (see
 * INTENSITY_THRESHOLDS in packages/analytics), not from the relative height
 * of the week, so "red" always means genuinely hot rather than merely the
 * best day of a quiet week.
 */
const HEAT = {
  none: 'bg-newton-bg/[0.07]',
  light: 'bg-newton-cyan/40',
  steady: 'bg-newton-cyan',
  strong: 'bg-newton-orange',
  intense: 'bg-red-500',
};

function formatMinutes(minutes) {
  if (!minutes) return 'no study yet';
  if (minutes < 60) return `${minutes}m studied`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m studied` : `${h}h studied`;
}

/** Streak widget with weekly bar chart */
export default function StreakCard({ data }) {
  const maxVal = Math.max(...data.weekDays.map((d) => d.value), 1);
  return (
    <Card className="p-4">
      {/* Top row: streak info + total hours */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-newton-orange/15 flex items-center justify-center">
            <FlameIcon className="w-[18px] h-[18px] text-newton-orange" />
          </div>
          <div>
            <p className="text-newton-bg font-bold text-sm leading-none">
              {data.days}-day streak
            </p>
            <p className="text-newton-bg/50 text-[11px] mt-1">{data.subtitle}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-newton-bg font-bold text-sm leading-none">
            {data.totalHours}h {data.totalMins}m
          </p>
          <p className="text-newton-bg/40 text-[10px] font-semibold tracking-wide uppercase mt-1">
            This week
          </p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end justify-between gap-1 h-12 mb-3">
        {data.weekDays.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-sm progress-fill ${HEAT[day.intensity] ?? HEAT.none} ${
                day.today ? 'ring-1 ring-newton-bg/25' : ''
              }`}
              style={{
                height: `${day.value > 0 ? (day.value / maxVal) * 100 : 8}%`,
                minHeight: '4px',
              }}
              title={`${day.label}: ${formatMinutes(day.minutes ?? 0)}`}
            />
            <span className="text-newton-bg/40 text-[9px] leading-none">{day.label}</span>
          </div>
        ))}
      </div>

      {/* Weekly goal progress */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] text-newton-bg/50 whitespace-nowrap">
          <FlagIcon className="w-3 h-3 text-newton-blue-mid" />
          Weekly goal — {data.weeklyGoalHours}h of study
        </span>
        <div className="flex-1 h-1.5 bg-newton-bg/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-newton-blue-mid to-newton-cyan progress-fill"
            style={{ width: `${data.weeklyGoalProgress}%` }}
          />
        </div>
        <span className="text-newton-blue-mid font-bold text-xs shrink-0">
          {data.weeklyGoalProgress}%
        </span>
      </div>
    </Card>
  );
}
