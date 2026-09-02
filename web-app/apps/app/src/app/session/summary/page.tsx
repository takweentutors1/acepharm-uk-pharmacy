import React from 'react';
import type { Metadata } from 'next';
import { SessionSummary } from '@/components/session-summary';

export const metadata: Metadata = {
  title: 'Practice Session Summary — AcePharm',
  description: 'Session results, review grid, pace metrics, and targeted weak-topic remediation.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SessionSummaryPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <SessionSummary />
    </main>
  );
}
