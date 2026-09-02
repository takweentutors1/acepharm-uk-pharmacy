import React from 'react';
import type { Metadata } from 'next';
import { QuestionPlayer } from '@/components/question-player';

export const metadata: Metadata = {
  title: 'Active Revision Session — AcePharm',
  description: 'Clinical question screen with instant per-option rationales, confidence rating, and guideline citations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActiveSessionPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <QuestionPlayer />
    </main>
  );
}
