import { describe, it, expect } from 'vitest';

export function evaluateDayMeaningful(questionsCount: number, activeSeconds: number): boolean {
  const activeMinutes = Math.floor(activeSeconds / 60);
  return questionsCount >= 5 || activeMinutes >= 10;
}

export function computeContinuousStreak(
  dailyRecords: { date: string; questionsCount: number; activeSeconds: number }[],
  todayDateStr: string
): { currentStreak: number; longestStreak: number } {
  const map = new Map<string, boolean>();
  for (const r of dailyRecords) {
    map.set(r.date, evaluateDayMeaningful(r.questionsCount, r.activeSeconds));
  }

  const todayObj = new Date(todayDateStr);
  const yesterdayObj = new Date(todayObj.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

  const todayIsMeaningful = map.get(todayDateStr) ?? false;
  let checkObj = todayIsMeaningful ? todayObj : yesterdayObj;

  let currentStreak = 0;
  while (true) {
    const dStr = checkObj.toISOString().slice(0, 10);
    if (map.get(dStr)) {
      currentStreak++;
      checkObj = new Date(checkObj.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  // Longest streak calculation
  const sortedDates = Array.from(map.keys()).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const isMeaningful = map.get(dStr);
    if (!isMeaningful) {
      tempStreak = 0;
      prevDate = null;
      continue;
    }

    const currDate = new Date(dStr);
    if (prevDate) {
      const diff = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = currDate;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

describe('Meaningful Session Streak Calculator (Section 8 — Milestone 4)', () => {
  it('qualifies a day if questionsCount >= 5 regardless of duration', () => {
    expect(evaluateDayMeaningful(5, 120)).toBe(true);
    expect(evaluateDayMeaningful(4, 120)).toBe(false);
  });

  it('qualifies a day if activeMinutes >= 10 regardless of question count', () => {
    expect(evaluateDayMeaningful(2, 600)).toBe(true); // 10 mins
    expect(evaluateDayMeaningful(2, 599)).toBe(false); // under 10 mins
  });

  it('calculates continuous streaks correctly across calendar days', () => {
    const records = [
      { date: '2026-08-25', questionsCount: 10, activeSeconds: 300 }, // Meaningful (day 1)
      { date: '2026-08-26', questionsCount: 6, activeSeconds: 400 },  // Meaningful (day 2)
      { date: '2026-08-27', questionsCount: 0, activeSeconds: 700 },  // Meaningful via 11 mins (day 3)
      { date: '2026-08-28', questionsCount: 5, activeSeconds: 200 },  // Meaningful today (day 4)
    ];

    const result = computeContinuousStreak(records, '2026-08-28');
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });

  it('preserves active streak from yesterday if user has not yet practiced today', () => {
    const records = [
      { date: '2026-08-26', questionsCount: 10, activeSeconds: 300 },
      { date: '2026-08-27', questionsCount: 8, activeSeconds: 400 },
      { date: '2026-08-28', questionsCount: 0, activeSeconds: 0 }, // today: not yet started
    ];

    const result = computeContinuousStreak(records, '2026-08-28');
    expect(result.currentStreak).toBe(2); // Still alive from yesterday
  });

  it('breaks streak when a calendar day is missed', () => {
    const records = [
      { date: '2026-08-24', questionsCount: 10, activeSeconds: 300 },
      { date: '2026-08-25', questionsCount: 10, activeSeconds: 300 },
      // 2026-08-26 missed!
      { date: '2026-08-27', questionsCount: 8, activeSeconds: 400 },
      { date: '2026-08-28', questionsCount: 5, activeSeconds: 200 },
    ];

    const result = computeContinuousStreak(records, '2026-08-28');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});
