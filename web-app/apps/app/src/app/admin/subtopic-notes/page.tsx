import React from 'react';
import type { Metadata } from 'next';
import { SubtopicNotesEditor } from '@/components/subtopic-notes-editor';

export const metadata: Metadata = {
  title: 'Subtopic Clinical Notes Editor — AcePharm Clinical Admin',
  description: 'Author and publish clinical study notes with markdown and responsive tables.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSubtopicNotesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <SubtopicNotesEditor />
    </main>
  );
}
