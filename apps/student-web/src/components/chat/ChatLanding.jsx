'use client';

import { useEffect, useState } from 'react';
import { SUBJECTS } from '@/lib/subjects';
import { SUBJECT_ICON_MAP } from '@/components/dashboard/icons';
import { PlayIcon } from '@/components/dashboard/icons';
import { fetchResumeSession } from '@/lib/chatApi';

function subjectLabel(id) {
  return SUBJECTS.find((s) => s.id === id)?.label ?? id;
}

function formatLastSeen(dateStr) {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  const startOfDay = (date) => { const c = new Date(date); c.setHours(0, 0, 0, 0); return c; };
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

/** revealLevel (0..3) as a rough progress percentage — the only real "how far along" signal a chat session has. */
function progressPercent(revealLevel) {
  return Math.round((revealLevel / 3) * 100);
}

/**
 * Chat landing screen — replaces the old SubjectPickerModal popup. Shown
 * inline as the /chat page itself when no subject is picked yet (CLAUDE.md
 * "Session & concept model": one chat per (student, subject), no concept
 * seeded by the AI). Tapping a subject calls onSelect, same contract the
 * modal used, so chat/page.jsx's handleSelectSubject is unchanged.
 */
export default function ChatLanding({ onSelect }) {
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchResumeSession()
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) setResume(data.data);
        setLoadingResume(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingResume(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-full bg-white animate-fade-in">
      <div className="relative bg-newton-bg px-5 pt-8 pb-10 overflow-hidden rounded-b-[28px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vector.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-[300px] opacity-30"
        />
        <div className="relative">
          <h1 className="text-newton-cyan-ghost font-bold text-xl leading-tight">
            Select Your Preferred Subject
          </h1>
          <p className="text-newton-cyan-lighter text-xs mt-1">
            Pick what you'd like to chat with Newton about
          </p>
        </div>
      </div>

      <div className="px-4 -mt-5 relative space-y-5 pb-6">
        {!loadingResume && resume && (
          <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl p-4">
            <p className="text-newton-bg/40 text-[11px] font-semibold uppercase tracking-wide mb-2">
              Continue where you stopped
            </p>
            <div className="flex items-start justify-between mb-1">
              <p className="text-newton-blue-mid text-[10px] font-bold tracking-widest uppercase">
                {subjectLabel(resume.subject)}
              </p>
              <span className="text-newton-blue-mid font-bold text-base">
                {progressPercent(resume.revealLevel)}%
              </span>
            </div>
            <h3 className="text-newton-bg font-bold text-[15px] leading-snug mb-1">
              {resume.concept?.title}
            </h3>
            <p className="text-newton-bg/45 text-[11px] mb-3">{formatLastSeen(resume.updatedAt)}</p>

            <div className="h-1.5 bg-newton-bg/[0.08] rounded-full mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-newton-blue-mid via-newton-blue-bright to-newton-cyan"
                style={{ width: `${progressPercent(resume.revealLevel)}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => onSelect(resume.subject)}
              className="
                w-full flex items-center justify-center gap-2
                bg-newton-blue-mid hover:bg-newton-blue-bright
                text-white font-semibold text-sm py-2.5 rounded-xl
                transition-all duration-150 hover:shadow-lg hover:shadow-newton-blue-mid/30
                active:scale-[0.98]
              "
            >
              <PlayIcon className="w-4 h-4" />
              Resume lesson
            </button>
          </div>
        )}

        <div>
          <p className="text-newton-bg/40 text-[11px] font-semibold uppercase tracking-wide mb-2 px-1">
            Select subject
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SUBJECTS.map((subject) => {
              const Icon = SUBJECT_ICON_MAP[subject.icon];
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onSelect(subject.id)}
                  className="
                    flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left
                    bg-newton-bg hover:bg-newton-navy
                    transition-colors duration-150
                  "
                >
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    {Icon && <Icon className="w-[18px] h-[18px] text-newton-cyan" />}
                  </div>
                  <span className="text-newton-cyan-ghost font-semibold text-sm">{subject.label}</span>
                  <span className="flex items-center gap-1 text-newton-blue-bright text-[11px] font-medium">
                    <PlayIcon className="w-2.5 h-2.5" />
                    Start Learning
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
