'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import ChatMenu from '@/components/chat/ChatMenu';
import { SearchIcon } from './icons';

/**
 * TopNav
 * Sticky top bar for the dashboard shell, replacing the old static header
 * (brand text + search + a non-functional bell). It carries the hamburger
 * that opens the same menu the chat header uses — profile, Support, Sign Out
 * — so navigation is consistent across every dashboard route instead of
 * living only inside chat.
 *
 * A client component because the hamburger holds open/closed state, which
 * DashboardShell (a server component) cannot.
 *
 * Desktop-only, matching the header it replaces: each page renders its own
 * contextual mobile header, and mobile navigation is the BottomNav, so
 * showing this there would stack two headers.
 */
export default function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    ""
  );
}
