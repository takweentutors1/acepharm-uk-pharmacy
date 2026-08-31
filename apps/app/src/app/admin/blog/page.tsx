import React from 'react';
import type { Metadata } from 'next';
import { AdminBlogEditor } from '@/components/admin-blog-editor';

export const metadata: Metadata = {
  title: 'Blog Article Editor — AcePharm Admin',
  description: 'Author, edit, and publish AEO/GEO-optimised clinical revision guides to D1.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBlogPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://acepharm-api.takweencentreuk.workers.dev';
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <AdminBlogEditor apiBaseUrl={apiBaseUrl} />
    </main>
  );
}
