import Link from 'next/link';
import { ChevronRightIcon } from './icons';

/** Section heading with "See all" / action link */
export default function SectionHeader({ title, href = '#', linkText = 'See all' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-newton-bg font-semibold text-[15px]">{title}</h2>
      <Link
        href={href}
        className="text-newton-blue-mid text-xs font-medium hover:text-newton-blue-bright transition-colors flex items-center gap-0.5"
      >
        {linkText}
        <ChevronRightIcon className="w-3 h-3" />
      </Link>
    </div>
  );
}
