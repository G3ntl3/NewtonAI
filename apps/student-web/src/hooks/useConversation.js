'use client';

import { useCallback } from 'react';
import { tutorTurnSchema } from '@newton/types/src/conversation.js';
import { useConversationStore } from '@/stores/conversationStore';

/**
 * Sends a student message to POST /api/chat and reads the streamed body.
 *
 * The route streams the model's raw JSON text as it's generated, so the
 * bytes aren't valid/parseable JSON until the stream closes — there's no
 * partial-block rendering here, only a "tutor is typing" state while bytes
 * arrive, then the full validated turn once the stream ends.
 */
export function useConversation() {
  const subject = useConversationStore((state) => state.subject);
  const addMessage = useConversationStore((state) => state.addMessage);
  const setStreaming = useConversationStore((state) => state.setStreaming);
  const setError = useConversationStore((state) => state.setError);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!subject || !trimmed) return;

      setError('');
      addMessage({ role: 'student', text: trimmed });
      setStreaming(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subject, message: trimmed }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Could not reach the tutor. Try sending that again.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let raw = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
        }

        const parsed = JSON.parse(raw);
        if (parsed.error) {
          throw new Error(parsed.error);
        }

        // Same trust boundary the route enforces server-side — never render
        // model output the client hasn't validated itself either.
        const turn = tutorTurnSchema.parse(parsed);
        addMessage({ role: 'tutor', blocks: turn.blocks });
      } catch (err) {
        // Logged for debugging only (browser console) — the student always
        // sees the generic message below regardless of the real cause.
        console.error('[useConversation] sendMessage failed:', err);
        setError('Something went wrong on my end. Try sending that again.');
      } finally {
        setStreaming(false);
      }
    },
    [subject, addMessage, setStreaming, setError]
  );

  return { sendMessage };
}

export default useConversation;
