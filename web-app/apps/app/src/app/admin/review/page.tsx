import React from 'react';
import type { Metadata } from 'next';
import { ReviewWorkflowModal } from '@/components/review-workflow';

export const metadata: Metadata = {
  title: 'Clinical Review Queue — AcePharm Clinical Admin',
  description: 'Section 7.4 review state machine and governance checklists (Clinical, Educational, Editorial).',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReviewQueuePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <ReviewWorkflowModal />
    </main>
  );
}
