import ComingSoon from '@/components/dashboard/ComingSoon';
import { TargetIcon } from '@/components/dashboard/icons';

/**
 * goals page
 * Learning goals — not built yet.
 */
export default function Page() {
  return (
    <ComingSoon
      title="Learning goals"
      description="Set your own targets — topics to master, hours to study each week — and track them here. For now your weekly study goal is shown on the dashboard."
      icon={<TargetIcon className="w-6 h-6 text-newton-blue-mid" />}
    />
  );
}
