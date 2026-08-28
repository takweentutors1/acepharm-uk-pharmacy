'use client';

import React, { useState } from 'react';
import { Button, Card, Badge } from '@acepharm/ui';
import { StreakTracker } from '@/components/streak-tracker';
import { CategoryResetModal } from '@/components/category-reset-modal';
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
  FileSpreadsheet
} from 'lucide-react';

export default function StudentDashboardPage() {
  const [selectedResetCategory, setSelectedResetCategory] = useState<{ id: string; name: string; count: number } | null>(null);

  const categoriesOverview = [
    { id: 'cat-cv', name: 'Cardiovascular System', total: 28, attempted: 16, accuracy: 75, status: 'Secure' },
    { id: 'cat-calc', name: 'Calculations (Paper 1)', total: 25, attempted: 12, accuracy: 50, status: 'Needs Attention' },
    { id: 'cat-resp', name: 'Respiratory System', total: 20, attempted: 14, accuracy: 71, status: 'Developing' },
    { id: 'cat-endocrine', name: 'Endocrine System', total: 18, attempted: 6, accuracy: 83, status: 'Secure' },
    { id: 'cat-infections', name: 'Infections & Antimicrobials', total: 16, attempted: 4, accuracy: 50, status: 'First Pass' },
    { id: 'cat-cns', name: 'Central Nervous System', total: 14, attempted: 2, accuracy: 100, status: 'First Pass' },
    { id: 'cat-law', name: 'Pharmacy Law & Ethics', total: 14, attempted: 8, accuracy: 88, status: 'Secure' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-canvas">
      {/* App Header Navigation */}
      <header className="border-b border-border bg-surface sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center text-white font-bold text-base shadow-sm">
                A
              </span>
              <span className="text-xl font-bold tracking-tight text-ink">AcePharm</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate">
              <a href="/" className="text-indigo font-bold border-b-2 border-indigo py-5">Dashboard</a>
              <a href="/session/new" className="hover:text-ink transition-colors flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> Practice Builder
              </a>
              <a href="/admin/curriculum" className="hover:text-ink transition-colors flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Admin Portal
              </a>
              <a href="/admin/review" className="hover:text-ink transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Content Review
              </a>
              <a href="/admin/import" className="hover:text-ink transition-colors flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> Importer
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="teal" className="font-medium text-xs">
              MPharm Foundation Trainee
            </Badge>
            <div className="w-9 h-9 rounded-full bg-indigo/10 border border-indigo/20 text-indigo flex items-center justify-center font-bold text-xs">
              UK
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Hero Recommendation & Quick Practice Launcher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2 bg-surface border-indigo/30 ring-1 ring-indigo/10 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="default" className="text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> AI Recommendation (Milestone 4)
                </Badge>
                <span className="text-xs text-slate font-mono">135 Questions Live</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                Calculations: Cockcroft-Gault & Renal Dosing
              </h2>
              <p className="text-slate text-xs sm:text-sm mt-2 leading-relaxed">
                Based on your recent Paper 1 practice: accuracy is currently <strong>50%</strong>. We recommend a focused 10-question drill on creatinine clearance formulas and narrow therapeutic index adjustments.
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
          <StreakTracker currentStreak={4} longestStreak={12} isMeaningfulToday={true} todayQuestionsCount={8} todayActiveMinutes={14} />
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
            {categoriesOverview.map((cat) => (
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
            ))}
          </div>
        </Card>
      </main>

      {/* Explicit Category Reset Modal */}
      {selectedResetCategory && (
        <CategoryResetModal
          isOpen={Boolean(selectedResetCategory)}
          onClose={() => setSelectedResetCategory(null)}
          categoryId={selectedResetCategory.id}
          categoryName={selectedResetCategory.name}
          questionCount={selectedResetCategory.count}
          onResetSuccess={() => {
            console.log('Category practice attempts reset successfully.');
          }}
        />
      )}
    </div>
  );
}
