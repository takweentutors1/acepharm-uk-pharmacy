import React from 'react';
import type { Metadata } from 'next';
import { SpreadsheetImporter } from '@/components/spreadsheet-importer';

export const metadata: Metadata = {
  title: 'Spreadsheet Importer — AcePharm Clinical Admin',
  description: 'Bulk upload, validate against Section 7.3 rules, and commit seed questions as drafts.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminImporterPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <SpreadsheetImporter />
    </main>
  );
}
