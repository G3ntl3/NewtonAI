import './globals.css';

/**
 * Root layout
 * Wraps every route: providers, fonts, global styles.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
