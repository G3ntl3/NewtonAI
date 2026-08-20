import ComingSoon from '@/components/dashboard/ComingSoon';
import { BookIcon } from '@/components/dashboard/icons';

/**
 * subjects page
 * Per-subject topic browser — not built yet. This route previously did not
 * exist at all, so the sidebar's Subjects link 404'd.
 */
export default function Page() {
  return (
    <ComingSoon
      title="Subjects"
      description="Browse every topic in Physics, Chemistry, Biology and Maths, and pick exactly what to study next. Right now you can start any subject straight from Chat."
      icon={<BookIcon className="w-6 h-6 text-newton-blue-mid" />}
    />
  );
}
