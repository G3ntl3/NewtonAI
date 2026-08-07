'use client';

import { useMemo, useState } from 'react';
import { getLabCatalog } from '@/lib/labCatalog';
import { SUBJECTS } from '@/lib/subjects';
import { FlaskIcon, SearchIcon } from '@/components/dashboard/icons';
import ExperimentCard from '@/components/lab/ExperimentCard';

const TABS = [{ id: 'all', label: 'All' }, ...SUBJECTS.map((s) => ({ id: s.id, label: s.label }))];

/**
 * lab page — Virtual Laboratory catalog.
 * Cards are generated from getLabCatalog() (packages/simulations'
 * simulationBank + the coming-soon list) — adding a real sim to the bank
 * makes its card appear here automatically, nothing here needs to change.
 * Tapping a live card navigates to /lab/[simulationId] (a real page, not a
 * modal — see that route for the sim + formula). Guided practical steps,
 * WAEC tagging, and a resume-in-progress card are a separate future task —
 * this is the catalog only.
 */
export default function Page() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const catalog = useMemo(() => getLabCatalog(), []);
  const filtered = catalog.filter((e) => {
    const matchesTab = activeTab === 'all' || e.subject === activeTab;
    const matchesSearch = e.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="bg-newton-bg px-4 md:px-8 pt-4 md:pt-6 pb-4 rounded-b-3xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FlaskIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight truncate">Virtual Laboratory</h1>
              <p className="text-white/50 text-xs mt-0.5 truncate">Experiments · No equipment needed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={searchOpen ? 'Close search' : 'Search experiments'}
            aria-expanded={searchOpen}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors"
          >
            <SearchIcon className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {searchOpen && (
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiments"
            className="mt-3 w-full px-4 py-2 rounded-full bg-white/10 text-white text-sm placeholder:text-white/40 outline-none focus:bg-white/15"
          />
        )}

        <div className="flex items-center gap-2 overflow-x-auto pt-4 -mb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-newton-bg'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 md:py-6 space-y-3">
        <p className="text-newton-bg font-bold text-sm">
          {activeTab === 'all' ? 'All experiments' : `${TABS.find((t) => t.id === activeTab)?.label} experiments`}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((experiment) => (
            <ExperimentCard
              key={experiment.simulationId ?? experiment.title}
              experiment={experiment}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-newton-bg/40 text-xs px-1 py-6 text-center">No experiments match.</p>
        )}
      </div>
    </div>
  );
}
