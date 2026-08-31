'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Badge, 
  Card, 
  HeroRecommendationSkeleton, 
  StreakTrackerSkeleton, 
  CategoryCardSkeleton,
  Skeleton 
} from '@acepharm/ui';
import { StreakTracker } from '@/components/streak-tracker';
import { CategoryResetModal } from '@/components/category-reset-modal';
import { CancellationFlowModal } from '@/components/cancellation-flow-modal';
import { SubscriptionModal } from '@/components/subscription-modal';
import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/auth-context';
import { 
  Play, 
  Target, 
  Flame, 
  RotateCcw, 
  BookOpen, 
  Layers, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Stethoscope,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  CreditCard,
  LogOut,
  UserCheck
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  total: number;
  attempted: number;
  accuracy: number;
  status: string;
}

export default function StudentDashboardPage() {
  const { user, profile, signOut } = useAuth();
  const [selectedResetCategory, setSelectedResetCategory] = useState<{ id: string; name: string; count: number } | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [categoriesOverview, setCategoriesOverview] = useState<CategoryItem[]>([]);
  const [streakMetrics, setStreakMetrics] = useState<{
    currentStreak: number;
    longestStreak: number;
    todayQuestionsCount: number;
    todayActiveMinutes: number;
    isMeaningfulToday: boolean;
    streakHistory?: { date: string; questionsCount: number; activeMinutes: number; isMeaningful: boolean }[];
  }>({
    currentStreak: 0,
    longestStreak: 0,
    todayQuestionsCount: 0,
    todayActiveMinutes: 0,
    isMeaningfulToday: false,
    streakHistory: undefined,
  });
  const [recommendation, setRecommendation] = useState<{
    topicName: string;
    subtopicName: string;
    targetCount: number;
    explanation: string;
    estimatedAccuracy: number;
  }>({
    topicName: 'Respiratory medicines',
    subtopicName: 'Asthma and COPD',
    targetCount: 15,
    explanation: 'Based on your recent practice: we recommend a focused drill on clinical guidelines and inhaler technique.',
    estimatedAccuracy: 50,
  });
  const [dailyGoal, setDailyGoal] = useState({
    answeredToday: 12,
    dailyTarget: 20,
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://acepharm-api.takweencentreuk.workers.dev';

  useEffect(() => {
    async function loadLiveData() {
      try {
        // 1. Fetch real curriculum tree from Cloudflare D1
        const res = await fetch(`${API_URL}/api/v1/curriculum/tree`);
        let baseCategories: CategoryItem[] = [];

        if (res.ok) {
          const data = await res.json();
          const pathway = data.pathways?.[0];
          if (pathway && pathway.categories) {
            baseCategories = pathway.categories.map((cat: any) => {
              const subCount = cat.subtopics?.length || 1;
              const totalEst = subCount * 5;
              return {
                id: cat.id,
                name: cat.name,
                total: totalEst,
                attempted: 0,
                accuracy: 0,
                status: 'Not started',
              };
            });
            setCategoriesOverview(baseCategories);
          }
        }

        // 2. Fetch live user streak metrics, daily goal & progress metrics if authenticated
        if (user) {
          const token = await user.getIdToken();
          const headers = { Authorization: `Bearer ${token}` };

          // Fetch Live Progress Metrics & Coverage Map
          const metricsRes = await fetch(`${API_URL}/api/v1/analytics/metrics`, { headers });
          if (metricsRes.ok) {
            const mData = await metricsRes.json();
            if (mData.coverageMap && mData.coverageMap.length > 0) {
              const liveCategories: CategoryItem[] = mData.coverageMap.map((cov: any) => {
                const subAccuracies = (cov.subtopics || [])
                  .map((s: any) => s.firstPassAccuracy || 0)
                  .filter((a: number) => a > 0);
                const avgAcc = subAccuracies.length > 0
                  ? Math.round(subAccuracies.reduce((a: number, b: number) => a + b, 0) / subAccuracies.length)
                  : (cov.attemptedQuestions > 0 ? 70 : 0);

                return {
                  id: cov.categoryId,
                  name: cov.categoryName,
                  total: cov.totalQuestions || 10,
                  attempted: cov.attemptedQuestions || 0,
                  accuracy: avgAcc,
                  status: cov.statusLabel || (cov.attemptedQuestions > 0 ? 'Developing' : 'Not started'),
                };
              });
              setCategoriesOverview(liveCategories);
            }
          }

          // Fetch Streak
          const streakRes = await fetch(`${API_URL}/api/v1/analytics/streak`, { headers });
          if (streakRes.ok) {
            const sData = await streakRes.json();
            setStreakMetrics({
              currentStreak: sData.currentStreak ?? 0,
              longestStreak: sData.longestStreak ?? 0,
              todayQuestionsCount: sData.todayQuestionsCount ?? 0,
              todayActiveMinutes: sData.todayActiveMinutes ?? 0,
              isMeaningfulToday: Boolean(sData.isMeaningfulToday),
              streakHistory: sData.streakHistory,
            });
          }

          // Fetch Daily Goal
          const goalRes = await fetch(`${API_URL}/api/v1/analytics/daily-goal`, { headers });
          if (goalRes.ok) {
            const gData = await goalRes.json();
            setDailyGoal({
              answeredToday: gData.answeredToday ?? 0,
              dailyTarget: gData.dailyTarget ?? 20,
            });
          }

          // Fetch Recommendation
          const recRes = await fetch(`${API_URL}/api/v1/analytics/recommendation`, { headers });
          if (recRes.ok) {
            const rData = await recRes.json();
            if (rData.recommendation) {
              setRecommendation({
                topicName: rData.recommendation.topicName || 'Therapeutics',
                subtopicName: rData.recommendation.subtopicName || 'Clinical Guidelines',
                targetCount: rData.recommendation.recommendedCount || 15,
                explanation: rData.recommendation.explanation || 'Personalized recommendation based on your syllabus coverage.',
                estimatedAccuracy: rData.recommendation.estimatedAccuracy || 50,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch live database metrics, using fallback:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();
  }, [user]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-canvas">
      {/* Responsive Unified Navigation Header */}
      <AppHeader onOpenSubscription={() => setShowSubscriptionModal(true)} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Hero Recommendation & Quick Practice Launcher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <div className="lg:col-span-2">
                <HeroRecommendationSkeleton />
              </div>
              <StreakTrackerSkeleton />
            </>
          ) : (
            <>
              <Card className="p-6 lg:col-span-2 bg-surface border-indigo/30 ring-1 ring-indigo/10 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="default" className="text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Recommended Focus Drill
                    </Badge>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal text-xs font-bold border border-teal/20">
                      {profile?.displayName ? `Good evening, ${profile.displayName.split(' ')[0]}` : 'Active Session'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                    {recommendation.topicName}: {recommendation.subtopicName}, {recommendation.targetCount} questions
                  </h2>
                  <p className="text-slate text-xs sm:text-sm mt-2 leading-relaxed">
                    {recommendation.explanation}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => { window.location.href = '/session/active'; }}
                    className="flex items-center gap-2 text-xs font-bold shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start Recommended Focus Session
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => { window.location.href = '/session/new'; }}
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-indigo" /> Custom Session Builder
                  </Button>
                </div>
              </Card>

              {/* Meaningful Session Streak Widget */}
              <StreakTracker 
                currentStreak={streakMetrics.currentStreak} 
                longestStreak={streakMetrics.longestStreak} 
                isMeaningfulToday={streakMetrics.isMeaningfulToday} 
                todayQuestionsCount={streakMetrics.todayQuestionsCount} 
                todayActiveMinutes={streakMetrics.todayActiveMinutes}
                dailyGoalTarget={dailyGoal.dailyTarget}
                streakHistory={streakMetrics.streakHistory}
              />
            </>
          )}
        </div>

        {/* 2. Core Curriculum Systems & Category Reset (Dual-Store Management) */}
        <Card className="p-6 bg-surface border-border shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo" /> GPhC Therapeutic Systems & Practice Status
              </h2>
              <p className="text-xs text-slate mt-0.5">
                First-attempt baselines stay permanent. Reset individual categories anytime to refresh your practice pool.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = '/session/new'; }}
              className="text-xs self-start sm:self-auto font-semibold"
            >
              Configure Practice Session
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            ) : (
              categoriesOverview.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-lg border border-border bg-canvas/40 hover:bg-canvas transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-ink leading-snug">{cat.name}</h3>
                      <span className="text-[11px] text-slate font-mono">
                        {cat.attempted} / {cat.total} questions attempted
                      </span>
                    </div>
                    <Badge
                      variant={
                        cat.status === 'Secure' ? 'success' :
                        cat.status === 'Developing' ? 'info' :
                        cat.status === 'Needs Attention' ? 'warning' : 'default'
                      }
                      className="text-[10px]"
                    >
                      {cat.status}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate font-mono">
                      <span>Accuracy: {cat.accuracy}%</span>
                      <span>{Math.round((cat.attempted / cat.total) * 100)}% Coverage</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="bg-indigo h-full rounded-full"
                        style={{ width: `${(cat.attempted / cat.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { window.location.href = `/session/new?categoryId=${cat.id}`; }}
                      className="text-xs font-semibold text-indigo hover:text-indigo-deep flex items-center gap-1"
                    >
                      Practise <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedResetCategory({ id: cat.id, name: cat.name, count: cat.total })}
                      className="text-[11px] text-slate hover:text-rose-600 flex items-center gap-1 transition-colors"
                      title="Reset practice attempts for this category"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Practice
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Subscription & Account Self-Service Footer Panel */}
        <div className="p-5 bg-surface border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-wash text-indigo border border-indigo/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-ink text-sm">Subscription & Billing Management</p>
                <Badge variant={user ? "success" : "teal"} className="text-[10px] py-0">
                  {user ? "Active Pro Member" : "Explorer Access"}
                </Badge>
              </div>
              <p className="text-slate text-xs mt-0.5">
                Manage your £4.99/mo or £49.99/yr membership, download VAT invoices, update cards, or cancel anytime.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(true)}
              className="text-indigo hover:text-indigo-deep text-xs font-semibold px-3 py-1.5 rounded-btn border border-indigo/20 bg-indigo-wash hover:bg-indigo/10 transition-colors flex items-center gap-1.5"
            >
              Manage Subscription
            </button>
            <button
              type="button"
              onClick={() => setShowCancellationModal(true)}
              className="text-slate hover:text-danger text-xs font-semibold underline transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </main>

      {/* In-App Subscription & Billing Portal Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onOpenCancellation={() => setShowCancellationModal(true)}
      />

      {/* Explicit Category Reset Modal */}
      {selectedResetCategory && (
        <CategoryResetModal
          isOpen={Boolean(selectedResetCategory)}
          onClose={() => setSelectedResetCategory(null)}
          categoryId={selectedResetCategory.id}
          categoryName={selectedResetCategory.name}
          questionCount={selectedResetCategory.count}
          onResetSuccess={() => {
            setCategoriesOverview((prev) =>
              prev.map((c) =>
                c.id === selectedResetCategory.id
                  ? { ...c, attempted: 0, accuracy: 0, status: 'First Pass' }
                  : c
              )
            );
          }}
        />
      )}

      {/* Section 7.4 In-App Cancellation Flow Modal */}
      <CancellationFlowModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        currentPeriodEnd={new Date(Date.now() + 30 * 86400000)}
        onCancellationComplete={() => {
          // Handled inside modal with immediate optimistic feedback
        }}
      />
    </div>
  );
}
