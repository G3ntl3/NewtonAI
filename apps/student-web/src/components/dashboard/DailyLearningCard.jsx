import { ZapIcon, PlayIcon } from './icons';

/** Daily learning card — stays dark-navy as a bold accent CTA within the light dashboard */
export default function DailyLearningCard({ data }) {
  return (
    <div className="bg-newton-bg rounded-2xl border border-newton-blue-mid/30 p-4 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-newton-cyan/10 blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-newton-blue-mid/25 flex items-center justify-center">
            <ZapIcon className="w-4 h-4 text-newton-cyan-light" />
          </div>
          <div>
            <p className="text-newton-cyan-ghost font-bold text-sm leading-none">Daily Learning</p>
            <p className="text-newton-cyan-lighter text-[11px] mt-1">{data.label}</p>
          </div>
        </div>

        <button
          className="
            w-full flex items-center justify-center gap-2
            bg-newton-blue-mid hover:bg-newton-blue-bright
            text-white font-semibold text-sm py-2.5 rounded-xl
            transition-all duration-150 hover:shadow-lg hover:shadow-newton-blue-mid/30
            active:scale-[0.98]
          "
        >
          <PlayIcon className="w-4 h-4" />
          Start
        </button>
      </div>
    </div>
  );
}
