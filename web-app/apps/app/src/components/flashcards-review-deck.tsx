'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@acepharm/ui';
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Flame, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

export type SM2Grade = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardItem {
  id: string;
  userId: string;
  questionId?: string | null;
  subtopicId?: string | null;
  subtopicName?: string | null;
  frontPrompt: string;
  backAnswer: string;
  intervalDays: number;
  ease: number;
  dueAt: string;
  reviews: number;
  lapses: number;
  isDue: boolean;
}

export function FlashcardsReviewDeck() {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/ace/flashcards`);
      if (res.ok) {
        const data = await res.json() as { dueCards: FlashcardItem[]; upcomingCards: FlashcardItem[]; totalCount: number };
        const combined = [...(data.dueCards || []), ...(data.upcomingCards || [])];
        setCards(combined);
      }
    } catch (err) {
      console.warn('Flashcard fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrade(grade: SM2Grade) {
    if (currentIndex >= cards.length) return;
    const currentCard = cards[currentIndex];
    setSubmitting(true);

    try {
      await fetch(`${API_BASE}/api/v1/ace/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      });
      setReviewedCount((prev) => prev + 1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.warn('Submit flashcard review error:', err);
      // Advance anyway in client state
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-surface-raised rounded-2xl border border-border-subtle animate-pulse">
        <div className="text-center">
          <RotateCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Loading your spaced repetition deck...</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isDeckComplete = currentIndex >= cards.length;

  if (cards.length === 0 || isDeckComplete) {
    return (
      <Card className="p-8 text-center bg-surface-raised border border-border-subtle rounded-2xl shadow-sm">
        <div className="w-16 h-16 bg-brand-emerald-50 text-brand-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-emerald-200">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-ink">All Due Cards Reviewed!</h3>
        <p className="text-sm text-ink-muted mt-2 max-w-md mx-auto">
          {reviewedCount > 0 
            ? `Fantastic work! You have completed ${reviewedCount} clinical review cards today. Your SuperMemo-2 schedule is updated.`
            : 'You have zero flashcards due for review right now. Turn any question or clinical pearl into a card to reinforce your spaced recall.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setReviewedCount(0);
            }}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
          >
            Review All Cards Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Progress & Deck Status */}
      <div className="flex items-center justify-between px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Card {currentIndex + 1} of {cards.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Interval: {currentCard.intervalDays}d · Ease: {(currentCard.ease / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Flip Card Surface */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer perspective-1000 min-h-[260px] relative transition-transform duration-300 transform active:scale-[0.99]"
      >
        <Card className={`p-6 sm:p-8 min-h-[260px] flex flex-col justify-between rounded-2xl border-2 transition-all shadow-md ${
          isFlipped 
            ? 'bg-primary-50/50 border-primary/30' 
            : 'bg-white border-border-subtle hover:border-primary/40'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700">
                {currentCard.subtopicName || 'Clinical Pharmacology'}
              </span>
              <span className="text-xs text-ink-muted flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Click to {isFlipped ? 'show question' : 'reveal answer'}
              </span>
            </div>

            <div className="mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-ink-subtle mb-1">
                {isFlipped ? 'Clinical Answer / Pearl' : 'Clinical Prompt'}
              </h4>
              <p className="text-base sm:text-lg font-medium text-ink leading-relaxed">
                {isFlipped ? currentCard.backAnswer : currentCard.frontPrompt}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between text-xs text-ink-muted">
            <span>Reviews: {currentCard.reviews} · Lapses: {currentCard.lapses}</span>
            <span className="font-semibold text-primary">
              {isFlipped ? 'Tap below to grade recall' : 'Tap card to flip'}
            </span>
          </div>
        </Card>
      </div>

      {/* 4-Grade SuperMemo-2 Response Bar */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => handleGrade('again')}
            disabled={submitting}
            className="flex flex-col items-center py-2.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-all font-semibold text-xs active:scale-95"
          >
            <span className="text-sm font-bold">Again</span>
            <span className="text-[10px] text-red-500 font-normal mt-0.5">&lt; 1 day</span>
          </button>

          <button
            onClick={() => handleGrade('hard')}
            disabled={submitting}
            className="flex flex-col items-center py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition-all font-semibold text-xs active:scale-95"
          >
            <span className="text-sm font-bold">Hard</span>
            <span className="text-[10px] text-amber-500 font-normal mt-0.5">~1.2x</span>
          </button>

          <button
            onClick={() => handleGrade('good')}
            disabled={submitting}
            className="flex flex-col items-center py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-all font-semibold text-xs active:scale-95"
          >
            <span className="text-sm font-bold">Good</span>
            <span className="text-[10px] text-blue-500 font-normal mt-0.5">~2.5x</span>
          </button>

          <button
            onClick={() => handleGrade('easy')}
            disabled={submitting}
            className="flex flex-col items-center py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all font-semibold text-xs active:scale-95"
          >
            <span className="text-sm font-bold">Easy</span>
            <span className="text-[10px] text-emerald-600 font-normal mt-0.5">~3.2x</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-ink font-semibold text-sm rounded-xl transition-colors border border-border-subtle"
        >
          Show Answer (Spacebar / Tap)
        </button>
      )}
    </div>
  );
}
