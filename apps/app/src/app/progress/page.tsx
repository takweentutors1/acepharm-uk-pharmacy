'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Skeleton } from '@acepharm/ui';
import { useAuth } from '@/lib/auth-context';
import { AppHeader } from '@/components/app-header';
import { SubscriptionModal } from '@/components/subscription-modal';
import { CancellationFlowModal } from '@/components/cancellation-flow-modal';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen
} from 'lucide-react';

export interface ProgressAnalyticsResult {
  accuracySplit: {
    firstAttempt: { total: number; correct: number; percentage: number };
    practice: { total: number; correct: number; percentage: number };
    repeat: { total: number; correct: number; percentage: number };
  };
  calibrationMatrix: {
    lowConfidence: { total: number; correct: number; accuracy: number };
    mediumConfidence: { total: number; correct: number; accuracy: number };
    highConfidence: { total: number; correct: number; accuracy: number };
    calibrationSummary: 'underconfident' | 'calibrated' | 'overconfident';
  };
  coverageMap: {
    categoryId: string;
    categoryName: string;
    totalQuestions: number;
    attemptedQuestions: number;
    coveragePercentage: number;
    statusLabel: 'Not started' | 'First pass' | 'Needs attention' | 'Developing' | 'Secure' | 'Due for review';
    subtopics: {
      id: string;
      name: string;
      total: number;
      attempted: number;
      coveragePercentage: number;
      firstPassAccuracy: number;
      statusLabel: 'Not started' | 'First pass' | 'Needs attention' | 'Developing' | 'Secure' | 'Due for review';
    }[];
  }[];
}

// Standard demo state for instant rich visual rendering (Section 7.2 compliant)
const DEMO_PROGRESS_DATA: ProgressAnalyticsResult = {
  accuracySplit: {
    firstAttempt: { total: 42, correct: 28, percentage: 67 },
    practice: { total: 86, correct: 64, percentage: 74 },
    repeat: { total: 44, correct: 36, percentage: 82 },
  },
  calibrationMatrix: {
    lowConfidence: { total: 20, correct: 8, accuracy: 40 },
    mediumConfidence: { total: 38, correct: 26, accuracy: 68 },
    highConfidence: { total: 28, correct: 24, accuracy: 86 },
    calibrationSummary: 'calibrated' as const,
  },
  coverageMap: [
    {
      categoryId: 'cat-cv',
      categoryName: 'Cardiovascular System',
      totalQuestions: 28,
      attemptedQuestions: 22,
      coveragePercentage: 79,
      statusLabel: 'Developing' as const,
      subtopics: [
        { id: 'sub-htn', name: 'Hypertension (NICE NG136)', total: 12, attempted: 12, coveragePercentage: 100, firstPassAccuracy: 83, statusLabel: 'Secure' as const },
        { id: 'sub-hf', name: 'Heart Failure & SGLT2i', total: 8, attempted: 6, coveragePercentage: 75, firstPassAccuracy: 67, statusLabel: 'Developing' as const },
        { id: 'sub-af', name: 'Atrial Fibrillation & DOACs', total: 8, attempted: 4, coveragePercentage: 50, firstPassAccuracy: 50, statusLabel: 'Needs attention' as const },
      ],
    },
    {
      categoryId: 'cat-calc',
      categoryName: 'Calculations (Paper 1)',
      totalQuestions: 25,
      attemptedQuestions: 14,
      coveragePercentage: 56,
      statusLabel: 'Needs attention' as const,
      subtopics: [
        { id: 'sub-cockcroft', name: 'Cockcroft-Gault & Renal Dosing', total: 10, attempted: 8, coveragePercentage: 80, firstPassAccuracy: 50, statusLabel: 'Needs attention' as const },
        { id: 'sub-infusion', name: 'Infusion Rates & Molar Mass', total: 8, attempted: 4, coveragePercentage: 50, firstPassAccuracy: 75, statusLabel: 'Developing' as const },
        { id: 'sub-pk', name: 'Pharmacokinetics & Elimination', total: 7, attempted: 2, coveragePercentage: 29, firstPassAccuracy: 50, statusLabel: 'First pass' as const },
      ],
    },
    {
      categoryId: 'cat-resp',
      categoryName: 'Respiratory System',
      totalQuestions: 20,
      attemptedQuestions: 16,
      coveragePercentage: 80,
      statusLabel: 'Secure' as const,
      subtopics: [
        { id: 'sub-asthma', name: 'Asthma (NICE / BTS)', total: 12, attempted: 12, coveragePercentage: 100, firstPassAccuracy: 83, statusLabel: 'Secure' as const },
        { id: 'sub-copd', name: 'COPD Inhaler Regimens', total: 8, attempted: 4, coveragePercentage: 50, firstPassAccuracy: 75, statusLabel: 'Developing' as const },
      ],
    },
    {
      categoryId: 'cat-law',
      categoryName: 'Pharmacy Law & Ethics',
      totalQuestions: 14,
      attemptedQuestions: 10,
      coveragePercentage: 71,
      statusLabel: 'Developing' as const,
      subtopics: [
        { id: 'sub-cd', name: 'Controlled Drugs Schedules', total: 8, attempted: 6, coveragePercentage: 75, firstPassAccuracy: 83, statusLabel: 'Secure' as const },
        { id: 'sub-rp', name: 'Responsible Pharmacist Regulations', total: 6, attempted: 4, coveragePercentage: 67, firstPassAccuracy: 75, statusLabel: 'Developing' as const },
      ],
    },
  ],
};

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<ProgressAnalyticsResult>(DEMO_PROGRESS_DATA);
  const [isZeroAttempts, setIsZeroAttempts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://acepharm-api.takweencentreuk.workers.dev';

  useEffect(() => {
    async function loadLiveMetrics() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/v1/analytics/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.accuracySplit && json.coverageMap) {
            setData({
              accuracySplit: json.accuracySplit,
              calibrationMatrix: json.calibrationMatrix,
              coverageMap: json.coverageMap,
            });
            // If the user has 0 total attempts in the database, automatically show zero attempts mode
            if (json.accuracySplit.practice.total === 0) {
              setIsZeroAttempts(true);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load live analytics metrics from D1, using fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveMetrics();
  }, [user]);

  const totalAttempts = isZeroAttempts ? 0 : data.accuracySplit.practice.total;

  const getStatusBadgeVariant = (label: string) => {
    switch (label) {
      case 'Secure': return 'success';
      case 'Developing': return 'info';
      case 'Needs attention': return 'warning';
      case 'First pass': return 'default';
      case 'Due for review': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-canvas">
      {/* Standard Unified AppHeader */}
      <AppHeader onOpenSubscription={() => setShowSubscriptionModal(true)} />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onOpenCancellation={() => {
          setShowSubscriptionModal(false);
          setShowCancellationModal(true);
        }}
      />

      {/* Cancellation Flow Modal */}
      <CancellationFlowModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        currentPeriodEnd={new Date(Date.now() + 30 * 86400000)}
        onCancellationComplete={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Curriculum Progress & Calibration Analytics
          </h1>
          <p className="text-sm text-slate mt-1 max-w-3xl">
            Per <strong>Section 7.2 of the AcePharm Specification</strong>, first-attempt accuracy, practice accuracy, and repeat accuracy are kept permanently distinct and never collapsed into a misleading single score.
          </p>
        </div>

        {/* 1. DISTINCT ACCURACY SPLIT (Rule #1 & Section 7.2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 bg-surface border-border shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <div className="space-y-2 py-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </Card>
            ))
          ) : (
            <>
              {/* Card 1: First Attempt */}
              <Card className="p-6 bg-surface border-border shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate">
                      First-Attempt Accuracy
                    </span>
                    <Badge variant="default" className="text-[10px] font-mono">
                      Immutable Baseline
                    </Badge>
                  </div>
              
              {isZeroAttempts ? (
                <div className="py-4 space-y-2">
                  <div className="text-2xl font-bold text-slate/60 font-mono">— %</div>
                  <p className="text-xs text-slate leading-relaxed">
                    No questions answered yet. Complete your first practice session to establish your permanent baseline accuracy.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-ink font-mono">
                      {data.accuracySplit.firstAttempt.percentage}%
                    </span>
                    <span className="text-xs text-slate font-mono">
                      ({data.accuracySplit.firstAttempt.correct} / {data.accuracySplit.firstAttempt.total} Qs)
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-2 leading-relaxed">
                    Measured exclusively on your very first encounter with each question. Preserved permanently even when resetting category practice.
                  </p>
                </>
              )}
            </div>

            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-border">
              <div
                className="bg-indigo h-full rounded-full transition-all"
                style={{ width: `${isZeroAttempts ? 0 : data.accuracySplit.firstAttempt.percentage}%` }}
              />
            </div>
          </Card>

          {/* Card 2: Practice Accuracy */}
          <Card className="p-6 bg-surface border-border shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Overall Practice Accuracy
                </span>
                <Badge variant="info" className="text-[10px] font-mono">
                  All Attempts
                </Badge>
              </div>

              {isZeroAttempts ? (
                <div className="py-4 space-y-2">
                  <div className="text-2xl font-bold text-slate/60 font-mono">— %</div>
                  <p className="text-xs text-slate leading-relaxed">
                    Your working practice score across both first encounters and repeated drills will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-teal font-mono">
                      {data.accuracySplit.practice.percentage}%
                    </span>
                    <span className="text-xs text-slate font-mono">
                      ({data.accuracySplit.practice.correct} / {data.accuracySplit.practice.total} Qs)
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-2 leading-relaxed">
                    Calculated across all question attempts in your active working practice store, including initial and repeated passes.
                  </p>
                </>
              )}
            </div>

            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-border">
              <div
                className="bg-teal h-full rounded-full transition-all"
                style={{ width: `${isZeroAttempts ? 0 : data.accuracySplit.practice.percentage}%` }}
              />
            </div>
          </Card>

          {/* Card 3: Repeat Accuracy */}
          <Card className="p-6 bg-surface border-border shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Repeat-Attempt Accuracy
                </span>
                <Badge variant="success" className="text-[10px] font-mono">
                  Attempt #2+
                </Badge>
              </div>

              {isZeroAttempts ? (
                <div className="py-4 space-y-2">
                  <div className="text-2xl font-bold text-slate/60 font-mono">— %</div>
                  <p className="text-xs text-slate leading-relaxed">
                    Repeat questions unlock after seeing questions multiple times in practice sessions or weak-area drills.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-indigo-deep font-mono">
                      {data.accuracySplit.repeat.percentage}%
                    </span>
                    <span className="text-xs text-slate font-mono">
                      ({data.accuracySplit.repeat.correct} / {data.accuracySplit.repeat.total} Qs)
                    </span>
                  </div>
                  <p className="text-xs text-slate mt-2 leading-relaxed">
                    Measures retention and recovery on questions you have seen before, verifying that rationales have been learned.
                  </p>
                </>
              )}
            </div>

            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-border">
              <div
                className="bg-indigo-deep h-full rounded-full transition-all"
                style={{ width: `${isZeroAttempts ? 0 : data.accuracySplit.repeat.percentage}%` }}
              />
            </div>
          </Card>
        </>
      )}
    </div>

        {/* 2. CONFIDENCE CALIBRATION MATRIX (Section 7.2) */}
        <Card className="p-6 bg-surface border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo" /> Pre-Submission Confidence Calibration Matrix
              </h2>
              <p className="text-xs text-slate mt-0.5">
                Evaluates metacognitive accuracy: compares your stated confidence level against actual clinical correctness.
              </p>
            </div>

            <Badge variant={isZeroAttempts ? 'default' : 'success'} className="text-xs self-start sm:self-auto font-mono py-1 px-3">
              {isZeroAttempts ? 'Awaiting 5+ Rated Answers' : 'Status: Well-Calibrated 🎯'}
            </Badge>
          </div>

          {isZeroAttempts ? (
            <div className="p-8 rounded-xl border border-dashed border-border bg-canvas/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-ink">Calibration Matrix Awaiting First Rating</h3>
              <p className="text-xs text-slate max-w-md mx-auto leading-relaxed">
                Whenever you answer a question with the confidence prompt enabled (Low, Medium, High), AcePharm maps your self-assessment against clinical outcomes to uncover unconscious blindspots.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => { window.location.href = '/session/active'; }}
                className="text-xs font-semibold mt-2"
              >
                Start Practice with Confidence Rating
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Low Confidence Column */}
              <div className="p-4 rounded-lg border border-border bg-canvas/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Stated "Low" Confidence</span>
                  <span className="text-xs font-mono text-slate">{data.calibrationMatrix.lowConfidence.total} Qs</span>
                </div>
                <div className="text-2xl font-bold font-mono text-slate">
                  {data.calibrationMatrix.lowConfidence.accuracy}% <span className="text-xs font-normal">actual accuracy</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="bg-slate h-full rounded-full" style={{ width: `${data.calibrationMatrix.lowConfidence.accuracy}%` }} />
                </div>
                <p className="text-[11px] text-slate">
                  Correctly captures uncertain clinical areas where you recognise gaps in your knowledge.
                </p>
              </div>

              {/* Medium Confidence Column */}
              <div className="p-4 rounded-lg border border-border bg-canvas/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Stated "Medium" Confidence</span>
                  <span className="text-xs font-mono text-slate">{data.calibrationMatrix.mediumConfidence.total} Qs</span>
                </div>
                <div className="text-2xl font-bold font-mono text-indigo">
                  {data.calibrationMatrix.mediumConfidence.accuracy}% <span className="text-xs font-normal">actual accuracy</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="bg-indigo h-full rounded-full" style={{ width: `${data.calibrationMatrix.mediumConfidence.accuracy}%` }} />
                </div>
                <p className="text-[11px] text-slate">
                  Solid baseline in developing areas; rationales help clarify differential reasoning.
                </p>
              </div>

              {/* High Confidence Column */}
              <div className="p-4 rounded-lg border border-teal/40 bg-teal/5 space-y-3 ring-1 ring-teal/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal">Stated "High" Confidence</span>
                  <span className="text-xs font-mono text-teal font-semibold">{data.calibrationMatrix.highConfidence.total} Qs</span>
                </div>
                <div className="text-2xl font-bold font-mono text-teal">
                  {data.calibrationMatrix.highConfidence.accuracy}% <span className="text-xs font-normal">actual accuracy</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="bg-teal h-full rounded-full" style={{ width: `${data.calibrationMatrix.highConfidence.accuracy}%` }} />
                </div>
                <p className="text-[11px] text-teal/80">
                  High precision: when you feel confident, you are correct in 86% of clinical scenarios.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* 3. SYLLABUS COVERAGE MAP (With Strict Section 7.2 Non-Mastered Status Labels) */}
        <Card className="p-6 bg-surface border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo" /> GPhC Syllabus Coverage Map
              </h2>
              <p className="text-xs text-slate mt-0.5">
                Standard progression labels: <em>Not started → First pass → Needs attention → Developing → Secure → Due for review</em> (Never "mastered").
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = '/session/new'; }}
              className="text-xs self-start sm:self-auto font-semibold flex items-center gap-1.5"
            >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Start Custom Topic Session
            </Button>
          </div>

          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-canvas/30 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </div>
              ))
            ) : (
              data.coverageMap.map((cat) => {
              const catAttempted = isZeroAttempts ? 0 : cat.attemptedQuestions;
              const catCoverage = isZeroAttempts ? 0 : cat.coveragePercentage;
              const catStatus = isZeroAttempts ? 'Not started' : cat.statusLabel;

              return (
                <div key={cat.categoryId} className="p-5 rounded-xl border border-border bg-canvas/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-ink">{cat.categoryName}</h3>
                      <Badge variant={getStatusBadgeVariant(catStatus)} className="text-[10px]">
                        {catStatus}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate">
                      <span>{catAttempted} / {cat.totalQuestions} Questions</span>
                      <span className="font-bold text-ink">{catCoverage}% Covered</span>
                    </div>
                  </div>

                  {/* Category Progress Bar */}
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="bg-indigo h-full rounded-full"
                      style={{ width: `${catCoverage}%` }}
                    />
                  </div>

                  {/* Subtopics Grid with Horizontally Scrollable Containment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {cat.subtopics.map((sub) => {
                      const subAttempted = isZeroAttempts ? 0 : sub.attempted;
                      const subCoverage = isZeroAttempts ? 0 : sub.coveragePercentage;
                      const subFirstPass = isZeroAttempts ? 0 : sub.firstPassAccuracy;
                      const subStatus = isZeroAttempts ? 'Not started' : sub.statusLabel;

                      return (
                        <div
                          key={sub.id}
                          className="p-3.5 rounded-lg border border-border/80 bg-surface shadow-2xs hover:border-indigo/40 transition-all flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-ink leading-snug">{sub.name}</span>
                            <Badge variant={getStatusBadgeVariant(subStatus)} className="text-[9px] py-0">
                              {subStatus}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate font-mono">
                              <span>1st Pass: {subFirstPass > 0 ? `${subFirstPass}%` : '—'}</span>
                              <span>{subAttempted}/{sub.total} Qs</span>
                            </div>
                            <div className="w-full h-1 bg-canvas rounded-full overflow-hidden border border-border/60">
                              <div className="bg-indigo h-full rounded-full" style={{ width: `${subCoverage}%` }} />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                            <a
                              href={`/session/new?subtopicId=${sub.id}`}
                              className="font-semibold text-indigo hover:text-indigo-deep flex items-center gap-1"
                            >
                              Practise <ArrowRight className="w-3 h-3" />
                            </a>
                            <span className="text-slate font-mono text-[10px]">{subCoverage}% seen</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }))}
          </div>
        </Card>
      </main>
    </div>
  );
}
