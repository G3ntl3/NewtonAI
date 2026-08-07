import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Newton AI · Student Dashboard',
  description: 'Your personalised AI-powered learning companion. Track streaks, subjects, flashcards, goals and insights — all in one place.',
};

/**
 * Root layout
 * Wraps every route: providers, fonts, global styles.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter">{children}</body>
    </html>
  );
}
