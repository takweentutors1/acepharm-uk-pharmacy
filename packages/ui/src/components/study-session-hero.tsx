'use client';

import * as React from 'react';
import { Button } from './button';
import { Card } from './card';

export interface StudySessionHeroProps {
  displayName?: string | null;
  greeting?: string;
  recommendationTitle?: string;
  recommendationTopic?: string;
  questionCount?: number;
  weakestTopic?: string;
  strongestTopic?: string;
  dailyGoalAnswered?: number;
  dailyGoalTarget?: number;
  currentStreakDays?: number;
  resumeUrl?: string;
  isLoading?: boolean;
}

export const StudySessionHero: React.FC<StudySessionHeroProps> = ({
  displayName,
  greeting,
  recommendationTitle,
  recommendationTopic = 'Respiratory medicines',
  questionCount = 15,
  weakestTopic = 'Asthma and COPD',
  strongestTopic = 'Calculations',
  dailyGoalAnswered = 12,
  dailyGoalTarget = 20,
  currentStreakDays = 4,
  resumeUrl = 'https://app.acepharm.co.uk/session/new',
  isLoading = false,
}) => {
  // Compute contextual time greeting if not provided
  const computedGreeting = React.useMemo(() => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    const name = displayName?.split(' ')[0] || 'Learner';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [greeting, displayName]);

  const title = recommendationTitle || `Recommended next session: ${recommendationTopic}, ${questionCount} questions`;

  if (isLoading) {
    return (
      <Card className="max-w-3xl mx-auto bg-surface rounded-card border border-border shadow-card p-6 sm:p-8 text-left animate-pulse">
        <div className="h-4 bg-slate-lighter/50 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-slate-lighter/50 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-lighter/50 rounded w-1/2"></div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto bg-surface rounded-card border border-border shadow-card p-6 sm:p-8 text-left grid grid-cols-1 sm:grid-cols-3 gap-6 transition-all hover:border-indigo/40 hover:shadow-md">
      <div className="sm:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-light uppercase tracking-wider">
            Study Session
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold border border-teal/20">
            {computedGreeting}
          </span>
        </div>
        <h2 className="text-base font-bold text-ink leading-snug">
          {title}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate">
          <span>
            <strong className="text-ink">Weakest topic:</strong> {weakestTopic}
          </span>
          <span>
            <strong className="text-ink">Strongest topic:</strong> {strongestTopic}
          </span>
        </div>
      </div>
      <div className="flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 space-y-3">
        <div className="text-xs text-slate">
          <div>
            Daily target: <strong className="text-ink">{dailyGoalAnswered} of {dailyGoalTarget} questions</strong>
          </div>
          <div className="mt-1">
            Current streak: <strong className="text-ink">{currentStreakDays} study days</strong>
          </div>
        </div>
        <a href={resumeUrl} className="w-full block">
          <Button size="sm" variant="primary" className="w-full font-bold shadow-xs">
            Resume
          </Button>
        </a>
      </div>
    </Card>
  );
};
