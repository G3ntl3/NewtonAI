'use client';

import { useState } from 'react';
import Card from './Card';
import { PlayIcon, BookmarkIcon } from './icons';

/** Resume lesson card */
export default function ResumeLessonCard({ data }) {
  const [bookmarked, setBookmarked] = useState(Boolean(data.bookmarked));
  return (
    <Card className="p-4 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-newton-blue-mid/10 blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-1">
          <p className="text-newton-blue-mid text-[10px] font-bold tracking-widest uppercase">
            {data.subject} · {data.level}
          </p>
          <span className="text-newton-blue-mid font-bold text-base">{data.progress}%</span>
        </div>

        <h3 className="text-newton-bg font-bold text-[15px] leading-snug mb-1">
          {data.topic}
        </h3>
        <p className="text-newton-bg/45 text-[11px] mb-3">{data.lastSeen}</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-newton-bg/[0.08] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-newton-blue-mid via-newton-blue-bright to-newton-cyan progress-fill"
            style={{ width: `${data.progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="
              flex-1 flex items-center justify-center gap-2
              bg-newton-blue-mid hover:bg-newton-blue-bright
              text-white font-semibold text-sm py-2.5 rounded-xl
              transition-all duration-150 hover:shadow-lg hover:shadow-newton-blue-mid/30
              active:scale-[0.98]
            "
          >
            <PlayIcon className="w-4 h-4" />
            Resume lesson
          </button>
          <button
            type="button"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
            aria-pressed={bookmarked}
            onClick={() => setBookmarked((b) => !b)}
            className="
              w-10 h-10 shrink-0 rounded-xl border border-newton-bg/[0.12]
              flex items-center justify-center
              text-newton-bg/40 hover:text-newton-blue-mid hover:border-newton-blue-mid/50
              transition-colors
            "
          >
            <BookmarkIcon className="w-4 h-4" filled={bookmarked} />
          </button>
        </div>
      </div>
    </Card>
  );
}
