import Card from './Card';
import { FlameIcon, FlagIcon } from './icons';

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
              className={`w-full rounded-sm progress-fill ${
                day.today
                  ? 'bg-newton-blue-mid'
                  : day.value > 0
                  ? 'bg-newton-cyan/40'
                  : 'bg-newton-bg/[0.07]'
              }`}
              style={{
                height: `${day.value > 0 ? (day.value / maxVal) * 100 : 8}%`,
                minHeight: '4px',
              }}
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
