import ComingSoon from '@/components/dashboard/ComingSoon';
import { ChartIcon } from '@/components/dashboard/icons';

/**
 * progress page
 * Detailed progress analytics — not built yet.
 */
export default function Page() {
  return (
    <ComingSoon
      title="Progress"
      description="A full breakdown of what you have mastered, subject by subject, with your study time over the term. The dashboard already shows this week's summary."
      icon={<ChartIcon className="w-6 h-6 text-newton-blue-mid" />}
    />
  );
}
