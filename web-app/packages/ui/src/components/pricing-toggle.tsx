import * as React from 'react';
import { Button } from './button';
import { Card } from './card';

export const PricingToggle: React.FC = () => {
  const [isAnnual, setIsAnnual] = React.useState(true);

  return (
    <div className="w-full">
      {/* Cadence Toggle Switch */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-ink font-semibold' : 'text-slate'}`}>
          Monthly billing
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 ${
            isAnnual ? 'bg-indigo' : 'bg-slate-lighter'
          }`}
        >
          <span className="sr-only">Toggle annual billing</span>
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isAnnual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium flex items-center gap-2 transition-colors ${isAnnual ? 'text-ink font-semibold' : 'text-slate'}`}>
          <span>Yearly billing</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold border border-teal/20">
            Save £9.89/year
          </span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Explorer Plan */}
        <Card className="p-8 bg-surface border border-border rounded-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink">AcePharm Explorer</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-lighter/50 text-slate text-xs font-semibold">Free</span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink">£0</span>
            </div>
            <p className="text-xs text-slate mt-2">30 questions every month. No card required.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate">
              <li className="flex items-center gap-2">✓ 30 practice questions per month</li>
              <li className="flex items-center gap-2">✓ Option-by-option clinical rationales</li>
              <li className="flex items-center gap-2">✓ Isolated first-attempt accuracy calibration</li>
              <li className="flex items-center gap-2">✓ Bookmarks and personal study notes</li>
              <li className="flex items-center gap-2 text-slate-light">✗ Spaced-repetition flashcards</li>
              <li className="flex items-center gap-2 text-slate-light">✗ Ace AI tutor assistance</li>
            </ul>
          </div>
          <div className="mt-8">
            <a href="https://app.acepharm.co.uk/auth/register" className="block w-full">
              <Button variant="outline" className="w-full">Start revising free</Button>
            </a>
          </div>
        </Card>

        {/* Monthly Plan */}
        <Card className={`p-8 bg-surface border rounded-card shadow-xs flex flex-col justify-between transition-all ${
          !isAnnual ? 'border-indigo ring-2 ring-indigo/20 shadow-md' : 'border-border'
        }`}>
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink">AcePharm Monthly</h3>
              {!isAnnual && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-wash text-indigo text-xs font-bold">Selected</span>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink">£4.99</span>
              <span className="text-xs text-slate">/ month</span>
            </div>
            <p className="text-xs text-slate mt-2">Flexible access for focused revision periods.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate">
              <li className="flex items-center gap-2 font-medium text-ink">✓ Unlimited pharmacy questions & mocks</li>
              <li className="flex items-center gap-2 font-medium text-ink">✓ Ace AI tutor with full reference citations</li>
              <li className="flex items-center gap-2">✓ Option-by-option clinical rationales</li>
              <li className="flex items-center gap-2">✓ Dual-store first-attempt vs practice analytics</li>
              <li className="flex items-center gap-2">✓ Spaced repetition & weak area generator</li>
              <li className="flex items-center gap-2">✓ Cancel online anytime</li>
            </ul>
          </div>
          <div className="mt-8">
            <a href="https://app.acepharm.co.uk/auth/register?plan=monthly" className="block w-full">
              <Button variant={!isAnnual ? 'primary' : 'outline'} className="w-full">
                Choose monthly
              </Button>
            </a>
          </div>
        </Card>

        {/* Yearly Plan */}
        <Card className={`p-8 bg-surface border rounded-card shadow-card flex flex-col justify-between relative transition-all ${
          isAnnual ? 'border-indigo ring-2 ring-indigo/20' : 'border-border'
        }`}>
          {isAnnual && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo text-white text-xs font-bold shadow-xs">
              Most Popular · Save £9.89
            </div>
          )}
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-ink">AcePharm Yearly</h3>
              {isAnnual && (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold">Best Value</span>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-ink">£49.99</span>
              <span className="text-xs text-slate">/ year</span>
            </div>
            <p className="text-xs text-teal font-medium mt-2">Equivalent to £4.16/month (billed annually)</p>
            <ul className="mt-6 space-y-3 text-xs text-slate">
              <li className="flex items-center gap-2 font-medium text-ink">✓ Unlimited pharmacy questions & mocks</li>
              <li className="flex items-center gap-2 font-medium text-ink">✓ Ace AI tutor with full reference citations</li>
              <li className="flex items-center gap-2">✓ Option-by-option clinical rationales</li>
              <li className="flex items-center gap-2">✓ Spaced repetition & diagnostic weak area generator</li>
              <li className="flex items-center gap-2">✓ Full uninterrupted year through final exam season</li>
              <li className="flex items-center gap-2">✓ Exact proration shown on upgrade</li>
            </ul>
          </div>
          <div className="mt-8">
            <a href="https://app.acepharm.co.uk/auth/register?plan=yearly" className="block w-full">
              <Button variant="primary" className="w-full shadow-sm">
                Choose yearly
              </Button>
            </a>
          </div>
        </Card>
      </div>

      <div className="mt-12 text-center text-xs text-slate-light max-w-2xl mx-auto leading-relaxed">
        Clear renewal information. Cancel online anytime. Your completed progress and bookmarks remain safely stored in your account even if your paid subscription ends.
      </div>
    </div>
  );
};
