'use client';

import React from 'react';
import { Card, Badge } from '@acepharm/ui';
import { Flame, Target, Clock, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

export interface DayStreakProps {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  todayQuestionsCount: number;
  todayActiveMinutes: number;
  isMeaningfulToday: boolean;
  dailyGoalTarget: number;
  streakHistory: {
    date: string;
    questionsCount: number;
    activeMinutes: number;
    isMeaningful: boolean;
  }[];
}

const DEFAULT_STREAK_PROPS: DayStreakProps = {
  currentStreak: 4,
  longestStreak: 12,
  isActiveToday: true,
  todayQuestionsCount: 8,
  todayActiveMinutes: 14,
  isMeaningfulToday: true,
  dailyGoalTarget: 20,
  streakHistory: [
    { date: '2026-08-15', questionsCount: 15, activeMinutes: 18, isMeaningful: true },
    { date: '2026-08-16', questionsCount: 20, activeMinutes: 25, isMeaningful: true },
    { date: '2026-08-17', questionsCount: 0, activeMinutes: 0, isMeaningful: false },
    { date: '2026-08-18', questionsCount: 6, activeMinutes: 8, isMeaningful: true },
    { date: '2026-08-19', questionsCount: 12, activeMinutes: 15, isMeaningful: true },
    { date: '2026-08-20', questionsCount: 22, activeMinutes: 30, isMeaningful: true },
    { date: '2026-08-21', questionsCount: 0, activeMinutes: 0, isMeaningful: false },
    { date: '2026-08-22', questionsCount: 0, activeMinutes: 0, isMeaningful: false },
    { date: '2026-08-23', questionsCount: 5, activeMinutes: 7, isMeaningful: true },
    { date: '2026-08-24', questionsCount: 10, activeMinutes: 14, isMeaningful: true },
    { date: '2026-08-25', questionsCount: 18, activeMinutes: 22, isMeaningful: true },
    { date: '2026-08-26', questionsCount: 25, activeMinutes: 35, isMeaningful: true },
    { date: '2026-08-27', questionsCount: 8, activeMinutes: 12, isMeaningful: true },
    { date: '2026-08-28', questionsCount: 8, activeMinutes: 14, isMeaningful: true },
  ],
};

export function StreakTracker({
  currentStreak = DEFAULT_STREAK_PROPS.currentStreak,
  longestStreak = DEFAULT_STREAK_PROPS.longestStreak,
  isActiveToday = DEFAULT_STREAK_PROPS.isActiveToday,
  todayQuestionsCount = DEFAULT_STREAK_PROPS.todayQuestionsCount,
  todayActiveMinutes = DEFAULT_STREAK_PROPS.todayActiveMinutes,
  isMeaningfulToday = DEFAULT_STREAK_PROPS.isMeaningfulToday,
  dailyGoalTarget = DEFAULT_STREAK_PROPS.dailyGoalTarget,
  streakHistory = DEFAULT_STREAK_PROPS.streakHistory,
}: Partial<DayStreakProps>) {
  const goalProgressPercent = Math.min(
    100,
    Math.round((todayQuestionsCount / dailyGoalTarget) * 100)
  );

  return (
    <Card className="p-5 bg-surface border-border shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Flame className="w-5 h-5 fill-current" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              Meaningful Revision Streak
              {currentStreak > 0 && (
                <Badge variant="danger" className="text-[11px] font-mono py-0 px-2">
                  {currentStreak} Days 🔥
                </Badge>
              )}
            </h2>
            <p className="text-xs text-slate">
              Requires <strong>≥5 questions</strong> or <strong>≥10 active minutes</strong> per calendar day.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate font-mono block">Best Record</span>
          <span className="text-sm font-bold text-ink font-mono">{longestStreak} Days</span>
        </div>
      </div>

      {/* Daily Goal & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo" /> Daily Revision Target ({todayQuestionsCount}/{dailyGoalTarget} Qs)
          </span>
          <span className="font-mono text-slate font-medium">
            {todayActiveMinutes} mins active today
          </span>
        </div>

        <div className="w-full h-2.5 bg-canvas rounded-full overflow-hidden border border-border">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isMeaningfulToday ? 'bg-teal' : 'bg-indigo'
            }`}
            style={{ width: `${goalProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate">
          <span>
            {isMeaningfulToday ? (
              <span className="text-teal font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Meaningful session requirement met today!
              </span>
            ) : (
              <span>Need {Math.max(0, 5 - todayQuestionsCount)} more Qs or {Math.max(0, 10 - todayActiveMinutes)} mins for streak</span>
            )}
          </span>
          <span>{goalProgressPercent}% to Daily Target</span>
        </div>
      </div>

      {/* 14-Day Visual Activity Heatmap Dots */}
      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate">
          <span>Last 14 Days Activity</span>
          <span className="text-[10px] text-slate/70">Timezone: UK (Europe/London)</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {streakHistory.map((day) => {
            const dateObj = new Date(day.date);
            const dayNum = dateObj.getDate();
            const monthStr = dateObj.toLocaleDateString('en-GB', { month: 'short' });

            return (
              <div
                key={day.date}
                className={`p-2 rounded-md border text-center transition-all flex flex-col items-center justify-between min-h-[54px] ${
                  day.isMeaningful
                    ? 'border-teal/40 bg-teal/10 text-ink ring-1 ring-teal/20'
                    : day.questionsCount > 0
                    ? 'border-indigo/30 bg-indigo/5 text-ink'
                    : 'border-border/60 bg-canvas/60 text-slate/50 opacity-60'
                }`}
                title={`${day.date}: ${day.questionsCount} Qs, ${day.activeMinutes} mins (${day.isMeaningful ? 'Meaningful Session' : 'Under 5 Qs/10m'})`}
              >
                <span className="text-[9px] text-slate font-mono uppercase">{monthStr} {dayNum}</span>
                <span className="font-mono text-xs font-bold mt-0.5">
                  {day.questionsCount > 0 ? `${day.questionsCount}Q` : '—'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full mt-1 bg-current" />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
