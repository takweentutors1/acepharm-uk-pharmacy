import React from 'react';
import type { Metadata } from 'next';
import { SessionBuilder } from '@/components/session-builder';

export const metadata: Metadata = {
  title: 'Start Revision Session — AcePharm',
  description: 'Customize practice sessions by therapeutic category, subtopic, mode, and question count.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SessionBuilderPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <SessionBuilder />
    </main>
  );
}
