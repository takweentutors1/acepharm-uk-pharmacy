import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AcePharm App — Clinical Practice & Revision',
  description: 'Practice questions and clinical reasoning for UK pharmacy students.',
  robots: {
    index: false,
    follow: false, // Learner app and admin are strictly noindexed
  },
};

import { AnalyticsProvider } from '@/components/analytics-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-canvas text-ink antialiased font-sans flex flex-col">
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
