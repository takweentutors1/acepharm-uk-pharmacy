import React from 'react';
import type { Metadata } from 'next';
import { CurriculumManager } from '@/components/curriculum-manager';

export const metadata: Metadata = {
  title: 'Curriculum Manager — AcePharm Clinical Admin',
  description: 'Manage pathways, clinical categories, and subtopics.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminCurriculumPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <CurriculumManager />
    </main>
  );
}
