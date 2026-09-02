import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';

export interface SampleQuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
  rationale: string;
}

export interface SampleQuestionData {
  id: string;
  publicId: string;
  sector: string;
  category: string;
  stem: string;
  leadIn: string;
  options: SampleQuestionOption[];
  guidelineReference: string;
  takeaway: string;
}

const SAMPLE_QUESTION: SampleQuestionData = {
  id: 'demo-sample-1',
  publicId: 'ACP-CV-0012',
  sector: 'Community',
  category: 'Cardiovascular & Therapeutics',
  stem: 'A 62-year-old male of Afro-Caribbean heritage with a history of hypertension and osteoarthritis attends the community pharmacy for a blood pressure review. His clinic BP is 154/94 mmHg, confirmed with repeat daytime ABPM of 146/90 mmHg. He has no prior history of diabetes or renal impairment. Baseline U&Es are normal (eGFR > 90 mL/min/1.73m², K+ 4.4 mmol/L).',
  leadIn: 'According to NICE NG136 hypertension guidelines, which of the following is the most appropriate initial pharmacological therapy?',
  options: [
    {
      id: 'opt-a',
      label: 'A',
      content: 'Ramipril 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Sub-optimal Step 1 for patients aged ≥ 55 or of Black African/African-Caribbean heritage without type 2 diabetes. Initial therapy is a CCB due to lower baseline plasma renin.',
    },
    {
      id: 'opt-b',
      label: 'B',
      content: 'Amlodipine 5 mg once daily',
      isCorrect: true,
      rationale: 'Correct choice. Under NICE NG136, initial (Step 1) antihypertensive monotherapy for adults of Black African or African-Caribbean origin without type 2 diabetes is a Calcium Channel Blocker (CCB).',
    },
    {
      id: 'opt-c',
      label: 'C',
      content: 'Indapamide 1.5 mg modified-release once daily',
      isCorrect: false,
      rationale: 'Thiazide-like diuretics are second-line (Step 2 in combination with CCB) or alternative Step 1 only if a CCB is contraindicated (e.g. severe oedema).',
    },
    {
      id: 'opt-d',
      label: 'D',
      content: 'Losartan 50 mg once daily',
      isCorrect: false,
      rationale: 'ARBs are preferred over ACE inhibitors in Black patients when an RAAS inhibitor is indicated (e.g. in type 2 diabetes), but CCBs remain first-line here.',
    },
    {
      id: 'opt-e',
      label: 'E',
      content: 'Bisoprolol 2.5 mg once daily',
      isCorrect: false,
      rationale: 'Beta-blockers are not recommended as routine initial monotherapy for uncomplicated essential hypertension under NICE NG136.',
    },
  ],
  guidelineReference: 'NICE NG136: Hypertension in adults: diagnosis and management (Updated 2023)',
  takeaway: 'In adults of Black African or African-Caribbean heritage without type 2 diabetes, Step 1 monotherapy is a Calcium Channel Blocker (Amlodipine).',
};

export default function InteractiveSampleQuestion() {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hideOptions, setHideOptions] = useState(false);

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setHideOptions(false);
  };

  const selectedOption = SAMPLE_QUESTION.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;

  return (
    <Card className="max-w-3xl mx-auto p-6 sm:p-8 bg-surface border border-indigo/30 ring-1 ring-indigo/10 shadow-lg text-left relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="teal" className="text-xs font-bold uppercase tracking-wider font-mono">
            {SAMPLE_QUESTION.publicId}
          </Badge>
          <span className="text-xs font-semibold text-slate">
            {SAMPLE_QUESTION.sector} Pharmacy &bull; {SAMPLE_QUESTION.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHideOptions(!hideOptions)}
            className="text-xs font-medium text-slate hover:text-ink px-2.5 py-1 rounded bg-canvas border border-border transition-colors"
          >
            {hideOptions ? 'Show Options' : 'Cover Options (Active Recall)'}
          </button>
          {isSubmitted && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-indigo hover:text-indigo-deep transition-colors"
            >
              Reset Demo
            </button>
          )}
        </div>
      </div>

      {/* Clinical Vignette Stem */}
      <div className="py-5 space-y-3">
        <p className="text-sm sm:text-base text-ink leading-relaxed">
          {SAMPLE_QUESTION.stem}
        </p>
        <h3 className="text-sm sm:text-base font-bold text-ink leading-snug pt-2 border-t border-border/60">
          {SAMPLE_QUESTION.leadIn}
        </h3>
      </div>

      {/* Options */}
      {!hideOptions ? (
        <div className="space-y-2.5 pt-1" role="radiogroup" aria-label="Sample Question Options">
          {SAMPLE_QUESTION.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let style = 'border-border bg-surface hover:bg-canvas/80 text-ink';

            if (isSelected && !isSubmitted) {
              style = 'border-indigo bg-indigo/5 ring-2 ring-indigo text-ink font-semibold';
            } else if (isSubmitted) {
              if (opt.isCorrect) {
                style = 'border-teal bg-teal/10 text-ink ring-2 ring-teal shadow-xs font-semibold';
              } else if (isSelected && !opt.isCorrect) {
                style = 'border-rose-500 bg-rose-50 text-ink ring-2 ring-rose-500';
              } else {
                style = 'border-border/50 opacity-60 text-slate';
              }
            }

            return (
              <div
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSubmitted ? -1 : 0}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-3.5 sm:p-4 rounded-btn border transition-all cursor-pointer select-none ${style}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-current">
                      {opt.label}
                    </span>
                    <span className="text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                      {opt.content}
                    </span>
                  </div>

                  {isSubmitted && (
                    <span className="shrink-0 text-xs font-bold pt-0.5">
                      {opt.isCorrect ? (
                        <span className="text-teal">✓ Correct</span>
                      ) : isSelected ? (
                        <span className="text-rose-600">✕ Incorrect</span>
                      ) : null}
                    </span>
                  )}
                </div>

                {/* Per-option rationale reveal */}
                {isSubmitted && (
                  <div className="mt-2.5 pt-2.5 border-t border-border/40 text-xs leading-relaxed text-slate font-normal">
                    <strong className="text-ink font-semibold">
                      {opt.isCorrect ? 'Why this is correct:' : `Option ${opt.label} Analysis:`}{' '}
                    </strong>
                    {opt.rationale}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-canvas border border-dashed border-border rounded-btn space-y-2 my-2">
          <p className="text-xs font-semibold text-slate">Options covered for diagnostic recall.</p>
          <button
            type="button"
            onClick={() => setHideOptions(false)}
            className="text-xs font-bold text-indigo hover:underline"
          >
            Click to uncover options &rarr;
          </button>
        </div>
      )}

      {/* Action Submit Bar or Explanation Card */}
      {!isSubmitted ? (
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate">
            Select an answer above to test your clinical pharmacology recall.
          </span>
          <Button
            variant="primary"
            size="md"
            disabled={!selectedOptionId}
            onClick={handleSubmit}
            className="w-full sm:w-auto text-xs font-bold px-6 shadow-sm"
          >
            Submit Answer
          </Button>
        </div>
      ) : (
        <div className="mt-6 p-4 sm:p-5 rounded-card bg-canvas border border-border space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo">
              NICE Clinical Key Takeaway
            </span>
            <span className="text-[11px] font-mono text-slate">
              {SAMPLE_QUESTION.guidelineReference}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-ink font-medium leading-relaxed">
            {SAMPLE_QUESTION.takeaway}
          </p>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate">
              {isCorrect ? '🎉 Great job!' : '💡 Solid learning opportunity.'} Practice 1,500+ authentic GPhC scenarios on AcePharm.
            </div>
            <a
              href="https://app.acepharmexams.co.uk/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-btn bg-indigo px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-deep transition-all shadow-sm"
            >
              Start Full Free Revision Bank &rarr;
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
