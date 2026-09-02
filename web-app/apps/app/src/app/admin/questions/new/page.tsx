import React from 'react';
import type { Metadata } from 'next';
import { QuestionEditor } from '@/components/question-editor';

export const metadata: Metadata = {
  title: 'Question Editor — AcePharm Clinical Admin',
  description: 'Author, validate, and review clinical questions against Section 7.3 checklist rules.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminQuestionEditorPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <QuestionEditor />
    </main>
  );
}
