import ComingSoon from '@/components/dashboard/ComingSoon';
import { TrophyIcon } from '@/components/dashboard/icons';

/**
 * achievements page
 * Gamification / badges / leaderboard — not built yet.
 */
export default function Page() {
  return (
    <ComingSoon
      title="Achievements"
      description="Badges, milestones and the class leaderboard will live here — so you can see how far you have come and how you stack up. Your streak is already counting in the meantime."
      icon={<TrophyIcon className="w-6 h-6 text-newton-blue-mid" />}
    />
  );
}
