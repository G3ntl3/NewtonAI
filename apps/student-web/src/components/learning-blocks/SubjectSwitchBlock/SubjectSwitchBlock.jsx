'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useConversationStore } from '@/stores/conversationStore';
import { fetchChatSession } from '@/lib/chatApi';
import { SUBJECTS } from '@/lib/subjects';

const LABELS = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label]));

/**
 * SubjectSwitchBlock
 * Renders the 'subjectSwitch' Learning Block type — a button offering to
 * open a different subject's chat. Shown when the tutor decides (via
 * PromptBuilder's off-subject instruction) that the student's message
 * clearly belongs to another subject entirely. payload.targetSubject is
 * already Zod-validated to one of the four real subjects before this ever
 * renders (packages/types/src/conversation.js) — never parsed from prose.
 */
export default function SubjectSwitchBlock({ payload }) {
  const setSubject = useConversationStore((state) => state.setSubject);
  const setConcept = useConversationStore((state) => state.setConcept);
  const setHistory = useConversationStore((state) => state.setHistory);
  const [isSwitching, setSwitching] = useState(false);

  const label = LABELS[payload.targetSubject] ?? payload.targetSubject;

  async function handleClick() {
    setSwitching(true);
    setSubject(payload.targetSubject);
    const { ok, data } = await fetchChatSession(payload.targetSubject);
    if (ok) {
      setConcept(data.data.concept);
      setHistory(data.data.history);
    }
    setSwitching(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSwitching}
      className="
        flex items-center gap-2 px-4 py-2.5 rounded-xl
        bg-newton-blue-mid hover:bg-newton-blue-bright
        text-white text-sm font-semibold
        transition-colors disabled:opacity-60
      "
    >
      Open your {label} chat
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
