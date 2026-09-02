import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';

interface FeatureRow {
  category: string;
  name: string;
  description?: string;
  free: string | boolean;
  pro: string | boolean;
}

const COMPARISON_FEATURES: FeatureRow[] = [
  // 1. Question Bank & Mocks
  {
    category: 'Question Bank & Mocks',
    name: 'Practice Questions Monthly Access',
    free: '30 questions / month',
    pro: 'Unlimited (1,500+ items)',
  },
  {
    category: 'Question Bank & Mocks',
    name: 'GPhC Paper 1 & Paper 2 Timed Exam Mocks',
    free: 'Sample 10-item demo',
    pro: 'Full timed mocks with Pearson VUE countdown',
  },
  {
    category: 'Question Bank & Mocks',
    name: 'Detailed Option Rationale & Guidance Citations',
    free: true,
    pro: true,
  },
  {
    category: 'Question Bank & Mocks',
    name: 'Pearson VUE Built-in Calculator & Lab Ranges',
    free: true,
    pro: true,
  },

  // 2. AI Tutor & Diagnostic Coaching
  {
    category: 'AI Tutoring & Coaching',
    name: 'Ace AI 24/7 Clinical Pharmacist Tutor',
    description: 'Conversational mentoring with BNF / NICE guideline citations',
    free: false,
    pro: 'Unlimited inquiries & step explanations',
  },
  {
    category: 'AI Tutoring & Coaching',
    name: 'Interactive Consultation Simulation',
    description: 'Patient exchange scenarios with structured clinical rubric evaluations',
    free: '1 introductory scenario',
    pro: 'Full scenario bank across all sectors',
  },
  {
    category: 'AI Tutoring & Coaching',
    name: 'Personalized Weekly Clinical Insights',
    free: false,
    pro: true,
  },

  // 3. Spaced Repetition & Analytics
  {
    category: 'Spaced Repetition & Analytics',
    name: 'SM-2 Algorithm Clinical Flashcard Decks',
    free: false,
    pro: 'Automated daily spaced drills',
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Diagnostic Weak Area Generator',
    description: 'Generates targeted drills based on low first-attempt accuracy',
    free: false,
    pro: true,
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Isolated First-Attempt vs Practice Calibration',
    free: true,
    pro: true,
  },
  {
    category: 'Spaced Repetition & Analytics',
    name: 'Subtopic Personal Clinical Notes & Bookmarks',
    free: true,
    pro: true,
  },
];

export default function PlanComparisonMatrix() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    const normalized = promoCode.trim().toUpperCase();
    if (normalized === 'STUDENT20' || normalized === 'GPHC2026' || normalized === 'BPSA') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid coupon code. Try STUDENT20 or BPSA.');
      setPromoApplied(false);
    }
  };

  // Group by category
  const categories = Array.from(new Set(COMPARISON_FEATURES.map((f) => f.category)));

  return (
    <div className="mt-16 space-y-8">
      {/* Student Discount Banner & Promo Trigger */}
      <Card className="p-6 bg-gradient-to-r from-indigo-wash/80 via-surface to-teal-light/40 border border-indigo/20 shadow-xs rounded-card flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo">Student & Trainee Discount</span>
            <Badge variant="teal" className="text-[10px] font-bold">20% Off</Badge>
          </div>
          <h3 className="text-base font-bold text-ink">Are you an MPharm student or BPSA member?</h3>
          <p className="text-xs text-slate">Use code <strong className="text-indigo font-mono">STUDENT20</strong> during checkout to receive 20% off your annual plan.</p>
        </div>

        <form onSubmit={handleApplyPromo} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
              placeholder="Enter coupon (e.g. STUDENT20)"
              className="text-xs py-2 px-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light uppercase font-mono w-48 focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="text-xs font-bold whitespace-nowrap">
            {promoApplied ? '✓ Applied' : 'Apply'}
          </Button>
        </form>
      </Card>

      {promoApplied && (
        <div className="p-3 bg-teal-light border border-teal/30 rounded-btn text-teal text-xs font-semibold text-center animate-in fade-in">
          🎉 Promo code active! 20% discount will automatically apply at checkout (£39.99/year instead of £49.99).
        </div>
      )}

      {promoError && (
        <div className="p-2.5 bg-danger-wash border border-danger-border rounded-btn text-danger text-xs text-center">
          {promoError}
        </div>
      )}

      {/* Comparison Table Section */}
      <div className="bg-surface border border-border rounded-card shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink">Feature Comparison Matrix</h2>
            <p className="text-xs text-slate mt-0.5">Full side-by-side breakdown of the AcePharm revision tiers.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-indigo hover:text-indigo-deep transition-colors"
          >
            {isExpanded ? 'Collapse Table ▲' : 'Expand Table ▼'}
          </button>
        </div>

        {/* Expandable Table Content */}
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas border-b border-border text-slate">
                  <th className="py-3.5 px-4 sm:px-6 font-bold uppercase tracking-wider w-1/2">Revision Feature</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center w-1/4">Explorer (Free)</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center w-1/4 bg-indigo/5 text-indigo">
                    AcePharm Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <React.Fragment key={category}>
                    <tr className="bg-canvas/60">
                      <td colSpan={3} className="py-2.5 px-4 sm:px-6 font-bold text-ink uppercase tracking-wider text-[11px] bg-canvas">
                        {category}
                      </td>
                    </tr>
                    {COMPARISON_FEATURES.filter((f) => f.category === category).map((row) => (
                      <tr key={row.name} className="hover:bg-canvas/40 transition-colors">
                        <td className="py-3 px-4 sm:px-6 text-ink">
                          <div className="font-semibold">{row.name}</div>
                          {row.description && (
                            <div className="text-[11px] text-slate mt-0.5">{row.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate">
                          {typeof row.free === 'boolean' ? (
                            row.free ? (
                              <span className="text-teal font-bold text-sm">✓</span>
                            ) : (
                              <span className="text-slate-lighter text-sm">✕</span>
                            )
                          ) : (
                            <span className="font-medium text-[11px]">{row.free}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-indigo/[0.02]">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? (
                              <span className="text-teal font-bold text-sm">✓</span>
                            ) : (
                              <span className="text-slate-lighter text-sm">✕</span>
                            )
                          ) : (
                            <span className="font-bold text-indigo text-[11px]">{row.pro}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
