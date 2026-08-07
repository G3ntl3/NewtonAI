import DashboardShell from '@/components/dashboard/DashboardShell';

/**
 * Dashboard layout
 * Authenticated shell: sidebar (desktop), bottom nav (mobile), top header.
 */
export default function Layout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
