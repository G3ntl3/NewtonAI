/** Insight stat tile (2 × 2 grid) */
export default function InsightTile({ stat, icon: IconComponent }) {
  const isMastery = stat.total !== undefined;
  return (
    <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-newton-bg/[0.08] shadow-sm">
      <span className="w-7 h-7 rounded-lg bg-newton-blue-mid/10 flex items-center justify-center shrink-0 mt-0.5">
        <IconComponent className="w-3.5 h-3.5 text-newton-blue-mid" />
      </span>
      <div>
        <p className="text-newton-bg font-bold text-lg leading-none">
          {stat.value}{stat.unit}
          {!isMastery && (
            <span className="text-newton-blue-mid text-xs font-normal ml-1">{stat.change}</span>
          )}
          {isMastery && (
            <span className="text-newton-bg/40 text-xs font-normal ml-1">
              of {stat.total}
            </span>
          )}
        </p>
        <p className="text-newton-bg/45 text-[10px] mt-1">{stat.label}</p>
      </div>
    </div>
  );
}
