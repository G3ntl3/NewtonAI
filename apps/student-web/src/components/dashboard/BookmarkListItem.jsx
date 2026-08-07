import { SUBJECT_ICON_MAP, BookmarkIcon } from './icons';

/** Bookmark list item */
export default function BookmarkListItem({ bookmark }) {
  const SubjectIcon = SUBJECT_ICON_MAP[bookmark.subjectIcon] || BookmarkIcon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-newton-bg/[0.06] last:border-0 group">
      <div className="w-8 h-8 rounded-lg bg-newton-blue-mid/10 flex items-center justify-center shrink-0 group-hover:bg-newton-blue-mid/20 transition-colors">
        <SubjectIcon className="w-3.5 h-3.5 text-newton-blue-mid" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-newton-bg text-xs font-medium leading-snug">{bookmark.title}</p>
        <p className="text-newton-bg/40 text-[10px] mt-1">
          Saved from chat · {bookmark.timeAgo}
        </p>
      </div>
      <button
        aria-label="Bookmark"
        className="text-newton-bg/35 hover:text-newton-blue-mid transition-colors shrink-0 mt-0.5"
      >
        <BookmarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
