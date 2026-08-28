'use client';

import React, { useState } from 'react';
import { Button, Badge, Card, MarkdownRenderer } from '@acepharm/ui';
import { 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Save, 
  FileCheck, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  Calculator,
  Stethoscope,
  Info
} from 'lucide-react';

export interface OptionFormItem {
  label: string;
  content: string;
  isCorrect: boolean;
  rationale: string;
}

export function QuestionEditor() {
  const [publicId, setPublicId] = useState('ACP-CV-0012');
  const [pathwayId, setPathwayId] = useState('p-mpharm');
  const [primarySubtopicId, setPrimarySubtopicId] = useState('sub-htn');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'sba' | 'calculation'>('sba');
  const [sector, setSector] = useState<'community' | 'hospital' | 'gp' | 'any'>('community');
  const [status, setStatus] = useState<'draft' | 'awaiting_clinical_review' | 'published'>('draft');

  const [stem, setStem] = useState(
    'A 62-year-old male of Afro-Caribbean heritage with a history of hypertension and osteoarthritis attends the community pharmacy for a blood pressure check. His clinic BP is 154/94 mmHg, confirmed with repeat daytime ABPM of 146/90 mmHg. He has no prior history of diabetes or renal impairment. Baseline U&Es are normal (eGFR > 90 mL/min/1.73m², K+ 4.4 mmol/L).'
  );
  const [leadIn, setLeadIn] = useState(
    'According to NICE NG136 hypertension guidelines, which of the following is the most appropriate initial pharmacological therapy?'
  );

  const [options, setOptions] = useState<OptionFormItem[]>([
    {
      label: 'A',
      content: 'Ramipril 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Sub-optimal Step 1 for patients aged ≥ 55 or of Black African/African-Caribbean heritage without type 2 diabetes. Initial therapy is a CCB.',
    },
    {
      label: 'B',
      content: 'Amlodipine 5 mg once daily',
      isCorrect: true,
      rationale: 'Correct choice. Under NICE NG136, initial (Step 1) antihypertensive monotherapy for patients of Black African or African-Caribbean origin without type 2 diabetes is a Calcium Channel Blocker (CCB).',
    },
    {
      label: 'C',
      content: 'Indapamide 1.5 mg modified-release once daily',
      isCorrect: false,
      rationale: 'Thiazide-like diuretics are second-line (Step 2 in combination with CCB) or alternative Step 1 if a CCB is not tolerated or contraindicated (e.g. oedema).',
    },
    {
      label: 'D',
      content: 'Losartan 50 mg once daily',
      isCorrect: false,
      rationale: 'ARBs are preferred over ACE inhibitors in Black patients if an RAAS inhibitor is indicated (e.g. in type 2 diabetes), but CCBs remain the preferred first-line agent here.',
    },
    {
      label: 'E',
      content: 'Bisoprolol 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Beta-blockers are no longer recommended as initial routine monotherapy for uncomplicated essential hypertension under NICE NG136.',
    },
  ]);

  const [summaryTakeaway, setSummaryTakeaway] = useState(
    'In adults of Black African or African-Caribbean heritage without type 2 diabetes, Step 1 antihypertensive monotherapy is a Calcium Channel Blocker (Amlodipine).'
  );
  const [detailedExplanation, setDetailedExplanation] = useState(
    'NICE NG136 specifies that for adults aged 55 and over, or adults of Black African or African-Caribbean origin of any age without type 2 diabetes, the first-line antihypertensive therapy is a calcium channel blocker (CCB). ACE inhibitors or ARBs have lower efficacy as monotherapy in these patient cohorts due to lower baseline plasma renin activity.'
  );
  const [clinicalGuidanceReference, setClinicalGuidanceReference] = useState(
    'NICE Guideline NG136: Hypertension in adults: diagnosis and management (Updated 2023)'
  );

  // Live checklist evaluation (Section 7.3 Checklist)
  const hasStem = stem.trim().length >= 25;
  const hasLeadIn = leadIn.trim().length >= 5;
  const hasFiveOptions = options.length === 5;
  const hasSingleCorrect = options.filter((o) => o.isCorrect).length === 1;
  const allOptionsHaveRationale = options.every((o) => o.rationale.trim().length >= 10);
  const hasExplanations = summaryTakeaway.trim().length >= 10 && detailedExplanation.trim().length >= 20;

  const isChecklistComplete =
    hasStem && hasLeadIn && hasFiveOptions && hasSingleCorrect && allOptionsHaveRationale && hasExplanations;

  const handleCorrectOptionSelect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleOptionChange = (index: number, field: keyof OptionFormItem, value: any) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo/10 text-indigo">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                Question Authoring & Review Editor
              </h1>
              <span className="text-xs text-slate font-medium">
                Public ID: <span className="font-mono text-ink font-semibold">{publicId}</span> • MPharm ➔ Cardiovascular
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={status === 'published' ? 'success' : 'warning'}>
            Status: {status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus('draft')}
            className="text-xs"
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!isChecklistComplete}
            onClick={() => setStatus('published')}
            className="flex items-center gap-1.5 text-xs shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Validate & Publish
          </Button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Question Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metadata Card */}
          <Card className="p-4 bg-surface border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate font-medium block mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-input border border-border bg-canvas text-ink font-medium focus:ring-2 focus:ring-indigo outline-none"
              >
                <option value="sba">Single Best Answer (SBA)</option>
                <option value="calculation">Pharmaceutical Calculation</option>
              </select>
            </div>

            <div>
              <label className="text-slate font-medium block mb-1">Target Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-input border border-border bg-canvas text-ink font-medium focus:ring-2 focus:ring-indigo outline-none"
              >
                <option value="easy">Easy (Knowledge recall)</option>
                <option value="medium">Medium (Clinical application)</option>
                <option value="hard">Hard (Complex multi-morbidity)</option>
              </select>
            </div>

            <div>
              <label className="text-slate font-medium block mb-1">Practice Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-input border border-border bg-canvas text-ink font-medium focus:ring-2 focus:ring-indigo outline-none"
              >
                <option value="community">Community Pharmacy</option>
                <option value="hospital">Hospital Pharmacy</option>
                <option value="gp">GP Practice / PCN</option>
                <option value="any">General / Any Sector</option>
              </select>
            </div>
          </Card>

          {/* Stem & Lead-in */}
          <Card className="p-5 bg-surface border-border space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  1. Clinical Scenario / Vignette Stem <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate font-mono">{stem.length} characters</span>
              </div>
              <textarea
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                rows={4}
                placeholder="Present realistic patient demographics, history, lab findings, and clinical presentation..."
                className="w-full p-3 text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink leading-relaxed outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">
                2. Lead-In Question <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={leadIn}
                onChange={(e) => setLeadIn(e.target.value)}
                placeholder="e.g. Which of the following is the most appropriate initial therapy?"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>
          </Card>

          {/* Options with Mandatory Rationales */}
          <Card className="p-5 bg-surface border-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
                  3. Answer Options & Per-Option Rationales
                </h3>
                <p className="text-xs text-slate">
                  Every distractor and the correct answer must explain the clinical rationale.
                </p>
              </div>
              <Badge variant="outline">{options.length} Options</Badge>
            </div>

            <div className="space-y-4">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-card border transition-all ${
                    opt.isCorrect
                      ? 'border-teal/60 bg-teal/5 shadow-sm'
                      : 'border-border bg-canvas/40 hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Correctness radio selector */}
                    <div className="pt-1.5">
                      <input
                        type="radio"
                        id={`option-${idx}`}
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectOptionSelect(idx)}
                        className="h-4 w-4 text-teal focus:ring-teal cursor-pointer"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink w-4">{opt.label}.</span>
                        <input
                          type="text"
                          value={opt.content}
                          onChange={(e) => handleOptionChange(idx, 'content', e.target.value)}
                          placeholder={`Option ${opt.label} text...`}
                          className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-surface border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo font-medium"
                        />
                        {opt.isCorrect && (
                          <Badge variant="success" className="shrink-0 text-[10px]">
                            Correct Option
                          </Badge>
                        )}
                      </div>

                      {/* Mandatory Rationale Field */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[11px] font-semibold text-slate">
                            {opt.isCorrect ? 'Correct Option Explanation' : 'Distractor Explanation (Why is it incorrect?)'}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          {!opt.rationale.trim() && (
                            <span className="text-[10px] text-rose-500 font-medium">Required by Section 7.3</span>
                          )}
                        </div>
                        <textarea
                          value={opt.rationale}
                          onChange={(e) => handleOptionChange(idx, 'rationale', e.target.value)}
                          rows={2}
                          placeholder={`Explain why ${opt.label} is ${opt.isCorrect ? 'the guideline recommendation' : 'sub-optimal'}...`}
                          className={`w-full p-2 text-xs bg-surface border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo ${
                            !opt.rationale.trim() ? 'border-rose-300' : 'border-border'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Detailed Explanations */}
          <Card className="p-5 bg-surface border-border space-y-4">
            <h3 className="text-sm font-bold text-ink">4. Clinical Summary & Guidance Citation</h3>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                Summary Takeaway (Key Learning Point) <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={summaryTakeaway}
                onChange={(e) => setSummaryTakeaway(e.target.value)}
                rows={2}
                placeholder="High-yield 1-sentence learning point..."
                className="w-full p-2.5 text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                Detailed Clinical Rationale <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={detailedExplanation}
                onChange={(e) => setDetailedExplanation(e.target.value)}
                rows={4}
                placeholder="In-depth explanation covering pathophysiology, guideline criteria, and monitoring parameters..."
                className="w-full p-2.5 text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                Guideline Source / Citation
              </label>
              <input
                type="text"
                value={clinicalGuidanceReference}
                onChange={(e) => setClinicalGuidanceReference(e.target.value)}
                placeholder="e.g. NICE NG136, BNF 86, GPhC Standards..."
                className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-canvas border border-border rounded-input text-ink outline-none focus:ring-2 focus:ring-indigo"
              />
            </div>
          </Card>
        </div>

        {/* Right 4 Cols: Section 7.3 Validation Checklist Sidebar */}
        <div className="lg:col-span-4 space-y-4 sticky top-4">
          <Card className="p-5 bg-surface border-border shadow-sm space-y-4">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-bold text-ink flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo" /> Section 7.3 Validation Checklist
              </h2>
              <p className="text-xs text-slate mt-0.5">
                Enforced server-side. Questions cannot be published until all mandatory criteria pass.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                {hasStem ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">Clinical Stem & Vignette</span>
                  <span className="text-slate">Contains realistic patient presentation (≥25 chars)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                {hasLeadIn ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">Focused Lead-In</span>
                  <span className="text-slate">Clear prompt without ambiguous double negatives</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                {hasFiveOptions ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">5 Options (A through E)</span>
                  <span className="text-slate">Standard GPhC single best answer format</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                {hasSingleCorrect ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">Single Correct Option</span>
                  <span className="text-slate">Exactly one answer marked as correct</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                {allOptionsHaveRationale ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">Per-Option Rationales (Rule #3)</span>
                  <span className="text-slate">Every option explains why it is correct or incorrect</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                {hasExplanations ? (
                  <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold text-ink block">Summary & Detailed Explanations</span>
                  <span className="text-slate">Comprehensive rationale and guideline citations</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              {isChecklistComplete ? (
                <div className="p-3 rounded-card bg-teal/10 border border-teal/30 text-teal text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Ready for Clinical Publication
                </div>
              ) : (
                <div className="p-3 rounded-card bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Complete all checklist criteria to publish
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
