  'use client';

  import { Suspense, useEffect, useRef, useState } from 'react';
  import { useSearchParams } from 'next/navigation';
  import { Send, Menu, Image as ImageIcon, Mic } from 'lucide-react';
  import { useConversationStore } from '@/stores/conversationStore';
  import { useSessionStore } from '@/stores/sessionStore';
  import { useConversation } from '@/hooks/useConversation';
  import { fetchChatSession } from '@/lib/chatApi';
  import { SUBJECTS } from '@/lib/subjects';
  import LearningBlockRenderer from '@/components/learning-blocks/LearningBlockRenderer';
  import ChatLanding from '@/components/chat/ChatLanding';
  import ChatMenu from '@/components/chat/ChatMenu';
  import TurnActionsMenu from '@/components/chat/TurnActionsMenu';
  import AddFlashcardModal from '@/components/chat/AddFlashcardModal';
  import SimulationBlock from '@/components/learning-blocks/SimulationBlock';
  import { createBookmark } from '@/lib/bookmarkApi';
  import { createFlashcard } from '@/lib/flashcardApi';
  const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.label]));

  export default function ChatPage() {
    return (
      <Suspense fallback={null}>
        <ChatPageContent />

        
      </Suspense>
    );
  }

  function ChatPageContent() {
    const searchParams = useSearchParams();
    const { subject, concept, messages, isStreaming, error } = useConversationStore();
    const setSubject = useConversationStore((state) => state.setSubject);
    const setConcept = useConversationStore((state) => state.setConcept);
    const setHistory = useConversationStore((state) => state.setHistory);
    const reset = useConversationStore((state) => state.reset);
    const { sendMessage } = useConversation();
    // First name only, for the empty-state welcome. Mirrors the dashboard's
    // fallback chain minus the nickname (no profile fetch on this page).
    const user = useSessionStore((state) => state.user);
    const displayName =
      user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || '';
    const [input, setInput] = useState('');
    const [isLoadingHistory, setLoadingHistory] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [turnMenuIndex, setTurnMenuIndex] = useState(null);
    const [flashcardModalOpen, setFlashcardModalOpen] = useState(false);
    const [savingFlashcard, setSavingFlashcard] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
      if (!actionFeedback) return;
      const t = setTimeout(() => setActionFeedback(''), 2500);
      return () => clearTimeout(t);
    }, [actionFeedback]);

    async function handleBookmarkChat() {
      setTurnMenuIndex(null);
      const title = concept?.title || `${SUBJECT_LABELS[subject] ?? subject} chat`;
      const { ok } = await createBookmark({ title, subject, sourceType: 'chat' });
      setActionFeedback(ok ? 'Chat bookmarked' : 'Could not bookmark — try again');
    }

    async function handleSaveFlashcard({ question, answer }) {
      setSavingFlashcard(true);
      const { ok } = await createFlashcard({ question, answer, subject });
      setSavingFlashcard(false);
      setFlashcardModalOpen(false);
      setActionFeedback(ok ? 'Flashcard saved' : 'Could not save flashcard — try again');
    }

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // Leaving the chat page clears the picked subject, so navigating back in
    // always shows the subject picker fresh instead of silently reopening
    // whatever was picked earlier this browser session.
    useEffect(() => {
      return () => reset();
    }, [reset]);

    // Arriving via the BottomNav's Chat dropdown (/chat?subject=physics)
    // auto-selects that subject instead of showing the in-page picker.
    useEffect(() => {
      const picked = searchParams.get('subject');
      if (!subject && picked && SUBJECT_LABELS[picked]) {
        handleSelectSubject(picked);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    async function handleSelectSubject(pickedSubject) {
      setLoadingHistory(true);
      setSubject(pickedSubject);
      const { ok, data } = await fetchChatSession(pickedSubject);
      if (ok) {
        setConcept(data.data.concept);
        setHistory(data.data.history);
      }
      setLoadingHistory(false);
    }

    function handleSubmit(e) {
      e.preventDefault();
      if (!input.trim() || isStreaming) return;
      sendMessage(input);
      setInput('');
    }

    if (!subject) {
      return <ChatLanding onSelect={handleSelectSubject} />;
    }

    return (
      <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen bg-white animate-fade-in">
        <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-3 bg-white/95 backdrop-blur-sm border-b border-newton-bg/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="min-w-0">
              <h1 className="text-newton-bg font-bold text-base leading-tight truncate">
                {SUBJECT_LABELS[subject] ?? subject}
              </h1>
              {concept && (
                <p className="text-newton-bg/50 text-xs mt-0.5 truncate">{concept.title}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Chat menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-newton-bg/[0.06] transition-colors"
          >
            <Menu className="w-5 h-5 text-newton-bg/50" />
          </button>
        </header>

        {menuOpen && (
          <ChatMenu onClose={() => setMenuOpen(false)} onChangeSubject={reset} />
        )}

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3 space-y-3">
          
          <div className="flex justify-center">
            <span className="bg-newton-bg/[0.06] text-newton-bg/45 text-[11px] font-medium px-3 py-1 rounded-full">
              TODAY
            </span>
          </div>
          

          {isLoadingHistory && (
            <p className="text-newton-bg/45 text-xs px-1 py-2">Loading conversation…</p>
          )}

          {!isLoadingHistory && messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="" className="w-12 h-12 rounded-xl mb-4" />
              <h2 className="text-newton-bg text-xl font-bold">
                Welcome{displayName ? `, ${displayName}` : ''}!
              </h2>
              <p className="text-newton-bg/50 text-sm mt-1.5 max-w-xs">
                What would you like to learn in{' '}
                {SUBJECT_LABELS[subject] ?? subject} today?
              </p>
            </div>
          )}

          {messages.map((message, i) =>
            message.role === 'student' ? (
              <div key={i} className="flex justify-end">
                <div className="bg-newton-cyan-pale rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                  <p className="text-newton-bg text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            ) : (
              <div key={i} className="relative flex flex-col gap-2 items-start">
                <div className="flex items-center gap-2 pl-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/logo.png" alt="" className="w-5 h-5 rounded shrink-0" />
                  <span className="text-newton-bg/70 text-xs font-semibold">Newton AI</span>
                </div>
                {message.blocks.map((block, j) => (
                  <LearningBlockRenderer
                    key={j}
                    block={block}
                    onSave={() => setTurnMenuIndex(turnMenuIndex === i ? null : i)}
                    isSaveOpen={turnMenuIndex === i}
                  />
                ))}

                {turnMenuIndex === i && (
                  <TurnActionsMenu
                    onClose={() => setTurnMenuIndex(null)}
                    onBookmark={handleBookmarkChat}
                    onAddFlashcard={() => {
                      setTurnMenuIndex(null);
                      setFlashcardModalOpen(true);
                    }}
                  />
                )}
              </div>
            )
          )}

          {isStreaming && (
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-2 pl-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo.png" alt="" className="w-5 h-5 rounded shrink-0" />
                <span className="text-newton-bg/70 text-xs font-semibold">Newton AI</span>
              </div>
              <div className="bg-white border border-newton-bg/[0.08] shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-newton-bg/50 text-sm">Newton is thinking…</p>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-red-500 text-sm text-center pb-2">
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
        



        

        <form
          onSubmit={handleSubmit}
          className="shrink-0 flex items-center gap-2 px-4 md:px-8 py-4 bg-white border-t border-newton-bg/[0.06]"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message Newton
          </label>
          <div className="flex-1 flex items-center gap-1.5 bg-newton-bg/[0.045] rounded-full pl-4 pr-2">
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Ask newton anything..."
              className="
                flex-1 bg-transparent py-2.5 text-sm
                text-newton-bg placeholder:text-newton-bg/35
                focus:outline-none disabled:opacity-60
              "
            />
            {/* Decorative only — no attach/voice-input feature exists yet. */}
            <ImageIcon className="w-[18px] h-[18px] text-newton-bg/30 shrink-0" aria-hidden="true" />
            <Mic className="w-[18px] h-[18px] text-newton-bg/30 shrink-0" aria-hidden="true" />
          </div>
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            className="
              w-11 h-11 shrink-0 rounded-full
              bg-newton-blue-mid hover:bg-newton-blue-bright
              disabled:opacity-40 disabled:hover:bg-newton-blue-mid
              flex items-center justify-center transition-colors
            "
          >
            <Send className="w-[18px] h-[18px] text-white" />
          </button>
        </form>

        {actionFeedback && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-newton-bg text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg animate-fade-in">
            {actionFeedback}
          </div>
        )}

        {flashcardModalOpen && (
          <AddFlashcardModal
            onClose={() => setFlashcardModalOpen(false)}
            onSave={handleSaveFlashcard}
            saving={savingFlashcard}
          />
        )}
      </div>
    );
  }
