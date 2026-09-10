'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionPlayer, QuestionData } from '@/components/question-player';
import { apiClient } from '@/lib/api-client';

interface SessionQuestion {
  id: string;
  publicId: string;
  version: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'sba' | 'calculation';
  sector: 'community' | 'hospital' | 'gp' | 'any';
  content: {
    stem: string;
    leadIn: string;
  };
  options: Array<{
    id: string;
    label: string;
    content: string;
    isCorrect: boolean;
    rationale?: string;
  }>;
  explanation?: {
    summaryTakeaway: string;
    detailedExplanation: string;
    clinicalGuidanceReference?: string;
  };
}

interface SessionCreateResponse {
  sessionId: string;
  mode: 'learn' | 'timed';
  totalQuestions: number;
  timeLimitSeconds: number | null;
  questions: SessionQuestion[];
}

function mapApiQuestionToPlayerQuestion(q: SessionQuestion): QuestionData {
  return {
    id: q.id,
    publicId: q.publicId,
    version: q.version,
    difficulty: q.difficulty,
    questionType: q.questionType,
    sector: q.sector,
    stem: q.content.stem,
    leadIn: q.content.leadIn,
    options: q.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      content: opt.content,
      isCorrect: opt.isCorrect,
      rationale: opt.rationale,
    })),
    explanation: q.explanation
      ? {
          summaryTakeaway: q.explanation.summaryTakeaway,
          detailedExplanation: q.explanation.detailedExplanation,
          clinicalGuidanceReference: q.explanation.clinicalGuidanceReference,
        }
      : undefined,
  };
}

export function ActiveSession() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'learn';
    const count = parseInt(params.get('count') || '20', 10);
    const categories = params.get('categories') || '';
    const filter = params.get('filter') || 'all';

    const categoryIds = categories
      ? categories.split(',').filter(Boolean)
      : [];

    async function createSession() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if session data was pre-created by the builder
        const cachedSession = sessionStorage.getItem('acepharm_active_session');
        if (cachedSession) {
          const data = JSON.parse(cachedSession) as SessionCreateResponse;
          sessionStorage.removeItem('acepharm_active_session');
          setSessionId(data.sessionId);
          setQuestions(data.questions.map(mapApiQuestionToPlayerQuestion));
          return;
        }

        const response = await apiClient.post<SessionCreateResponse>(
          '/api/v1/sessions/create',
          {
            mode,
            questionCount: count,
            categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
            statusFilter: filter !== 'all' ? filter : undefined,
          }
        );

        setSessionId(response.sessionId);
        setQuestions(response.questions.map(mapApiQuestionToPlayerQuestion));
      } catch (err: any) {
        console.error('Failed to create session:', err);
        setError(err.message || 'Failed to load questions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    createSession();
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/session/summary?sessionId=${sessionId}`);
    }
  }, [currentIndex, questions.length, sessionId, router]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate">Loading your session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-sm text-rose-600">{error}</p>
            <button
              onClick={() => router.push('/session/new')}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-btn hover:bg-indigo-deep transition-colors"
            >
              Return to Session Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate">No questions found for this session.</p>
            <button
              onClick={() => router.push('/session/new')}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo rounded-btn hover:bg-indigo-deep transition-colors"
            >
              Return to Session Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuestionPlayer
      question={questions[currentIndex]}
      currentQuestionIndex={currentIndex + 1}
      totalQuestions={questions.length}
      sessionId={sessionId}
      onNext={handleNext}
    />
  );
}
