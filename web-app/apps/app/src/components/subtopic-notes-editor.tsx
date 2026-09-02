'use client';

import React, { useState } from 'react';
import { Button, Badge, Card, MarkdownRenderer } from '@acepharm/ui';
import { 
  BookOpen, 
  Eye, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Table as TableIcon, 
  Sparkles, 
  FileText,
  HelpCircle,
  Clock
} from 'lucide-react';

export interface SubtopicNote {
  id?: string;
  subtopicId: string;
  subtopicName: string;
  categoryName: string;
  contentMarkdown: string;
  published: boolean;
  version: number;
  updatedAt?: string;
}

const SAMPLE_NOTE: SubtopicNote = {
  subtopicId: 'sub-htn',
  subtopicName: 'Hypertension Guidelines (NICE NG136)',
  categoryName: 'Cardiovascular System',
  published: true,
  version: 3,
  updatedAt: 'Today at 14:32',
  contentMarkdown: `# NICE NG136: Hypertension Diagnosis & Pharmacotherapy Summary

> **Clinical Scope**: Stage 1, Stage 2, and severe hypertension management in adults under and over 55 years of age, or with type 2 diabetes.

## Stepwise Antihypertensive Drug Therapy

The choice of initial pharmacological therapy depends on patient age and ethnicity:

| Patient Demographics | First-Line (Step 1) | Step 2 (Dual Therapy) | Step 3 (Triple Therapy) | Step 4 (Resistant HTN) |
| :--- | :--- | :--- | :--- | :--- |
| **< 55 yrs (Non-Black African / Caribbean)** | ACE-inhibitor (e.g. Ramipril 2.5–10mg od) or ARB (e.g. Losartan) | ACEi / ARB + CCB (e.g. Amlodipine 5–10mg od) | ACEi/ARB + CCB + Thiazide-like diuretic (e.g. Indapamide 1.5mg SR) | Low-dose Spironolactone (25mg) if K+ ≤ 4.5 mmol/L; or Alpha/Beta-blocker if K+ > 4.5 |
| **≥ 55 yrs or Black African / Caribbean** | Calcium Channel Blocker (CCB, e.g. Amlodipine) | CCB + ACEi / ARB (or CCB + Thiazide-like diuretic) | ACEi/ARB + CCB + Thiazide-like diuretic (Indapamide) | Low-dose Spironolactone (25mg) or Alpha/Beta-blocker |
| **Type 2 Diabetes (Any Age / Ethnicity)** | ACE-inhibitor or ARB | ACEi / ARB + CCB or Thiazide-like diuretic | ACEi/ARB + CCB + Thiazide-like diuretic | Spironolactone / Alpha-blocker / Beta-blocker |

## Mandatory Clinical Monitoring

- **U&Es & eGFR**: Check baseline renal function before starting ACEi/ARB or diuretics. Recheck 1–2 weeks after initiation and titration.
- **Electrolyte thresholds**: An eGFR drop of up to 30% from baseline or serum creatinine increase up to 30% is acceptable. If creatinine rises > 30% or potassium exceeds 5.5 mmol/L, reduce dose or stop ACEi/ARB and investigate renal artery stenosis.
- **Clinic vs ABPM/HBPM Targets**:
  - Age < 80 years: Clinic < 140/90 mmHg; Daytime ABPM/HBPM < 135/85 mmHg.
  - Age ≥ 80 years: Clinic < 150/90 mmHg; Daytime ABPM/HBPM < 145/85 mmHg.
`,
};

export function SubtopicNotesEditor() {
  const [note, setNote] = useState<SubtopicNote>(SAMPLE_NOTE);
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');
  const [markdown, setMarkdown] = useState(note.contentMarkdown);
  const [isPublished, setIsPublished] = useState(note.published);
  const [isSaved, setIsSaved] = useState(true);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
    setIsSaved(false);
  };

  const handleSave = (publishState = isPublished) => {
    setNote((prev) => ({
      ...prev,
      contentMarkdown: markdown,
      published: publishState,
      version: prev.version + 1,
      updatedAt: 'Just now',
    }));
    setIsPublished(publishState);
    setIsSaved(true);
  };

  const insertTableTemplate = () => {
    const tableTemplate = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Value 1 | Value 2 | Value 3 |\n| Value 4 | Value 5 | Value 6 |\n`;
    setMarkdown((prev) => prev + tableTemplate);
    setIsSaved(false);
  };

  const insertClinicalCallout = () => {
    const callout = `\n> **NICE Guideline Alert**: State key UK clinical thresholds, monitoring intervals, or red flag referral criteria here.\n`;
    setMarkdown((prev) => prev + callout);
    setIsSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal/10 text-teal">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                Subtopic Notes Editor
              </h1>
              <span className="text-xs text-slate font-medium">
                {note.categoryName} ➔ {note.subtopicName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? 'success' : 'warning'}>
            {isPublished ? 'Published to Students' : 'Draft / Unpublished'}
          </Badge>
          <span className="text-xs text-slate font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> v{note.version} ({note.updatedAt || 'Saved'})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(!isPublished)}
            className="text-xs"
          >
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave(isPublished)}
            className="flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Editor Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-surface border border-border">
        {/* Formatting Shortcuts */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={insertTableTemplate}
            className="px-2.5 py-1.5 rounded hover:bg-canvas text-slate hover:text-ink font-medium transition-colors flex items-center gap-1 border border-border/60"
          >
            <TableIcon className="w-3.5 h-3.5 text-indigo" />
            Insert Table
          </button>
          <button
            type="button"
            onClick={insertClinicalCallout}
            className="px-2.5 py-1.5 rounded hover:bg-canvas text-slate hover:text-ink font-medium transition-colors flex items-center gap-1 border border-border/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Clinical Callout
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'write' ? 'bg-surface text-indigo shadow-sm' : 'text-slate hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" /> Write
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'preview' ? 'bg-surface text-indigo shadow-sm' : 'text-slate hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Preview
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all hidden md:flex items-center gap-1 ${
              activeTab === 'split' ? 'bg-surface text-indigo shadow-sm' : 'text-slate hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Split
          </button>
        </div>
      </div>

      {/* Main Editing Area */}
      <div className={`grid gap-6 ${activeTab === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Markdown Source Textarea */}
        {(activeTab === 'write' || activeTab === 'split') && (
          <Card className="p-4 bg-surface border-border flex flex-col min-h-[550px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
              <span className="text-xs font-semibold text-slate uppercase tracking-wider">Markdown Editor</span>
              <span className="text-xs text-slate font-mono">{markdown.length} chars</span>
            </div>
            <textarea
              value={markdown}
              onChange={handleMarkdownChange}
              placeholder="Write clinical subtopic notes using standard Markdown and tables..."
              className="flex-1 w-full p-3 font-mono text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink leading-relaxed outline-none focus:ring-2 focus:ring-indigo resize-none"
            />
          </Card>
        )}

        {/* Live Formatted Markdown Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <Card className="p-6 bg-surface border-border overflow-hidden flex flex-col min-h-[550px]">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60">
              <span className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal" /> Student View (Responsive & Scrollable Tables)
              </span>
              <Badge variant="outline">British English (en-GB)</Badge>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <MarkdownRenderer content={markdown} />
            </div>
          </Card>
        )}
      </div>

      {/* Editorial Standards Notice */}
      <Card className="p-4 bg-canvas border border-border text-xs text-slate space-y-1.5">
        <span className="font-semibold text-ink flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-indigo" /> Editorial & Table Guidelines (Section 10)
        </span>
        <p>
          • <strong>Responsive table containment</strong>: Tables must wrap in an <code className="text-indigo bg-surface px-1 rounded">overflow-x-auto</code> container so wide BNF comparison grids never clip or cause horizontal page jitter on mobile devices.
        </p>
        <p>
          • <strong>Language</strong>: British English spelling throughout (e.g. <em>pharmacotherapy</em>, <em>hypokalaemia</em>, <em>paediatric</em>, <em>licence</em>).
        </p>
      </Card>
    </div>
  );
}
