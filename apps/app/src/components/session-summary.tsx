'use client';

import React from 'react';
import { Button, Badge, Card } from '@acepharm/ui';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flame, 
  ArrowRight, 
  RotateCcw, 
  Target, 
  BookOpen, 
  BarChart3,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

export interface ReviewGridItem {
  index: number;
  questionId: string;
  publicId: string;
  isCorrect: boolean;
  confidence?: 'low' | 'medium' | 'high';
  timeTakenSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WeakTopicItem {
  subtopicId: string;
  name: string;
  categoryName: string;
  accuracy: number;
  totalQuestions: number;
}

interface SessionSummaryProps {
  score?: {
    totalQuestions: number;
    questionsAnswered: number;
    correctCount: number;
    accuracyPercentage: number;
  };
  timing?: {
    totalTimeSeconds: number;
    averageTimePerQuestionSeconds: number;
  };
  reviewGrid?: ReviewGridItem[];
  weakTopics?: WeakTopicItem[];
  onReviewQuestion?: (questionId: string) => void;
  onJumpToWeakTopic?: (subtopicId: string) => void;
  onNewSession?: () => void;
}

const DEFAULT_REVIEW_GRID: ReviewGridItem[] = [
  { index: 1, questionId: 'q-1', publicId: 'ACP-CV-0012', isCorrect: true, confidence: 'high', timeTakenSeconds: 38, difficulty: 'medium' },
  { index: 2, questionId: 'q-2', publicId: 'ACP-CV-0013', isCorrect: true, confidence: 'medium', timeTakenSeconds: 45, difficulty: 'hard' },
  { index: 3, questionId: 'q-3', publicId: 'ACP-RESP-0004', isCorrect: false, confidence: 'high', timeTakenSeconds: 52, difficulty: 'medium' },
  { index: 4, questionId: 'q-4', publicId: 'ACP-RESP-0005', isCorrect: true, confidence: 'high', timeTakenSeconds: 29, difficulty: 'easy' },
  { index: 5, questionId: 'q-5', publicId: 'ACP-CALC-0001', isCorrect: false, confidence: 'low', timeTakenSeconds: 85, difficulty: 'hard' },
  { index: 6, questionId: 'q-6', publicId: 'ACP-CALC-0002', isCorrect: true, confidence: 'medium', timeTakenSeconds: 70, difficulty: 'hard' },
  { index: 7, questionId: 'q-7', publicId: 'ACP-END-0008', isCorrect: true, confidence: 'high', timeTakenSeconds: 31, difficulty: 'easy' },
  { index: 8, questionId: 'q-8', publicId: 'ACP-INF-0011', isCorrect: false, confidence: 'medium', timeTakenSeconds: 44, difficulty: 'medium' },
  { index: 9, questionId: 'q-9', publicId: 'ACP-LAW-0003', isCorrect: true, confidence: 'high', timeTakenSeconds: 22, difficulty: 'easy' },
  { index: 10, questionId: 'q-10', publicId: 'ACP-CNS-0007', isCorrect: true, confidence: 'medium', timeTakenSeconds: 36, difficulty: 'medium' },
];

const DEFAULT_WEAK_TOPICS: WeakTopicItem[] = [
  {
    subtopicId: 'sub-calc-crcl',
    name: 'Cockcroft-Gault & Renal Dosing',
    categoryName: 'Pharmaceutical Calculations (Paper 1)',
    accuracy: 50,
    totalQuestions: 2,
  },
  {
    subtopicId: 'sub-resp-asthma',
    name: 'Adult Asthma Management (BTS/SIGN)',
    categoryName: 'Respiratory System',
    accuracy: 50,
    totalQuestions: 2,
  },
  {
    subtopicId: 'sub-inf-uti',
    name: 'Urinary Tract Infections (UKHSA)',
    categoryName: 'Infections & Antimicrobials',
    accuracy: 0,
    totalQuestions: 1,
  },
];

export function SessionSummary({
  score = {
    totalQuestions: 10,
    questionsAnswered: 10,
    correctCount: 7,
    accuracyPercentage: 70,
  },
  timing = {
    totalTimeSeconds: 452,
    averageTimePerQuestionSeconds: 45,
  },
  reviewGrid = DEFAULT_REVIEW_GRID,
  weakTopics = DEFAULT_WEAK_TOPICS,
  onReviewQuestion,
  onJumpToWeakTopic,
  onNewSession,
}: SessionSummaryProps) {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header Banner & High-Level Score Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal/10 text-teal">
              <Trophy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Practice Session Summary</h1>
          </div>
          <p className="text-sm text-slate mt-1">
            Session complete. Dual-store records logged to your GPhC progress profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewSession || (() => { window.location.href = '/session/new'; })}
            className="text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start New Session
          </Button>
        </div>
      </div>

      {/* 2. Top Metrics Grid (Score, Accuracy, Pace, Confidence) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo" /> Score
          </div>
          <div className="text-2xl font-black text-ink font-mono">
            {score.correctCount} <span className="text-sm font-normal text-slate">/ {score.totalQuestions}</span>
          </div>
          <div className="text-xs text-slate">
            {score.accuracyPercentage}% First Pass Accuracy
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal" /> Avg Time / Q
          </div>
          <div className="text-2xl font-black text-teal font-mono">
            {timing.averageTimePerQuestionSeconds}s
          </div>
          <div className="text-xs text-slate">
            Target: &lt;90s for GPhC Paper 2
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Total Duration
          </div>
          <div className="text-2xl font-black text-ink font-mono">
            {formatTime(timing.totalTimeSeconds)}
          </div>
          <div className="text-xs text-slate">
            Active revision time
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border shadow-sm space-y-1">
          <div className="text-xs font-semibold text-slate uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" /> Daily Goal
          </div>
          <div className="text-2xl font-black text-ink font-mono">
            +{score.questionsAnswered} Qs
          </div>
          <div className="text-xs text-teal font-medium">
            Streak maintained 🔥
          </div>
        </Card>
      </div>

      {/* 3. Interactive Review Grid (Visual Answer Map) */}
      <Card className="p-6 bg-surface border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo" /> Question Review Grid
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Click any question tile to inspect full rationale, stated confidence, and guideline citations.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-teal">
              <span className="w-2.5 h-2.5 rounded-full bg-teal" /> Correct ({score.correctCount})
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Incorrect ({score.totalQuestions - score.correctCount})
            </span>
          </div>
        </div>

        {/* 10x Grid of Question Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {reviewGrid.map((item) => (
            <button
              key={item.questionId}
              type="button"
              onClick={() => onReviewQuestion?.(item.questionId)}
              className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] flex flex-col justify-between ${
                item.isCorrect
                  ? 'border-teal/50 bg-teal/5 hover:bg-teal/10 text-ink'
                  : 'border-rose-300 bg-rose-50/60 hover:bg-rose-50 text-ink'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs font-mono">Q{item.index}</span>
                {item.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </div>

              <div className="text-[11px] font-mono text-slate truncate">
                {item.publicId}
              </div>

              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-slate">
                <span className="capitalize">{item.confidence || 'med'} conf</span>
                <span>{item.timeTakenSeconds}s</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 4. Jump-to-Weak-Topic Recommendation Engine */}
      {weakTopics.length > 0 && (
        <Card className="p-6 bg-surface border-indigo/30 ring-1 ring-indigo/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo/10 text-indigo">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink">Targeted Remediation & Weak Topics</h2>
                <p className="text-xs text-slate">
                  Topics where accuracy was below 70% in this session. Jump straight into focused subtopic drills.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {weakTopics.map((topic) => (
              <div
                key={topic.subtopicId}
                className="p-4 rounded-lg border border-border bg-canvas/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-canvas transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">{topic.name}</span>
                    <Badge variant="warning" className="text-[10px] font-mono">
                      {topic.accuracy}% Accuracy
                    </Badge>
                  </div>
                  <p className="text-xs text-slate">
                    {topic.categoryName} • {topic.totalQuestions} questions tested
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJumpToWeakTopic?.(topic.subtopicId)}
                  className="text-xs flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 font-semibold text-indigo hover:text-indigo-deep"
                >
                  <Zap className="w-3.5 h-3.5" /> Drill This Topic <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
