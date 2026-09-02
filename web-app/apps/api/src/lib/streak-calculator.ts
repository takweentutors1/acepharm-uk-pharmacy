import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { questionAttempts, sessions, users, userProfiles } from '../db/schema';

export interface DayStreakResult {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  todayQuestionsCount: number;
  todayActiveMinutes: number;
  isMeaningfulToday: boolean; // Meaningful rule: >= 5 questions OR >= 10 active minutes
  dailyGoalTarget: number;
  streakHistory: {
    date: string; // YYYY-MM-DD
    questionsCount: number;
    activeMinutes: number;
    isMeaningful: boolean;
  }[];
}

/**
 * Meaningful Session Streak Calculator (Section 8 - Milestone 4)
 * 
 * Qualification Criteria:
 * - A day counts towards the streak IF and ONLY IF:
 *   1. User answered ≥ 5 questions on that calendar day, OR
 *   2. User spent ≥ 10 active minutes (≥ 600 seconds) in practice sessions on that day.
 * 
 * Timezone-Aware: Uses the user's configured timezone (defaults to Europe/London).
 */
export async function calculateMeaningfulStreak(
  db: ReturnType<typeof drizzle>,
  userId: string,
  userTimezone: string = 'Europe/London'
): Promise<DayStreakResult> {
  // 1. Fetch user daily target
  const [profile] = await db
    .select({ dailyTarget: userProfiles.dailyQuestionTarget })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const dailyGoalTarget = profile?.dailyTarget || 20;

  // 2. Fetch all user attempts with timestamps and duration
  const attempts = await db
    .select({
      id: questionAttempts.id,
      timeTakenSeconds: questionAttempts.timeTakenSeconds,
      answeredAt: questionAttempts.answeredAt,
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId))
    .orderBy(desc(questionAttempts.answeredAt));

  // 3. Group attempts by local calendar day (YYYY-MM-DD in user's timezone)
  const dayStatsMap = new Map<string, { count: number; durationSeconds: number }>();

  for (const att of attempts) {
    if (!att.answeredAt) continue;
    
    // Format to YYYY-MM-DD in the target timezone
    const dateObj = new Date(att.answeredAt);
    const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: userTimezone }); // YYYY-MM-DD format

    const existing = dayStatsMap.get(dateStr) || { count: 0, durationSeconds: 0 };
    existing.count += 1;
    existing.durationSeconds += att.timeTakenSeconds || 0;
    dayStatsMap.set(dateStr, existing);
  }

  // 4. Determine today and yesterday in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone });
  
  const yesterdayObj = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayObj.toLocaleDateString('en-CA', { timeZone: userTimezone });

  const todayStats = dayStatsMap.get(todayStr) || { count: 0, durationSeconds: 0 };
  const todayMinutes = Math.floor(todayStats.durationSeconds / 60);
  const isMeaningfulToday = todayStats.count >= 5 || todayMinutes >= 10;

  // 5. Calculate continuous streaks (walking back day by day)
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if today qualifies or if streak is alive from yesterday
  let checkDate = isMeaningfulToday ? new Date(now) : yesterdayObj;
  
  while (true) {
    const dStr = checkDate.toLocaleDateString('en-CA', { timeZone: userTimezone });
    const stats = dayStatsMap.get(dStr);
    const isDayMeaningful = stats ? (stats.count >= 5 || Math.floor(stats.durationSeconds / 60) >= 10) : false;

    if (isDayMeaningful) {
      currentStreak += 1;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  // 6. Compute longest streak across all recorded history
  const sortedDates = Array.from(dayStatsMap.keys()).sort();
  if (sortedDates.length > 0) {
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const stats = dayStatsMap.get(dStr)!;
      const isDayMeaningful = stats.count >= 5 || Math.floor(stats.durationSeconds / 60) >= 10;

      if (!isDayMeaningful) {
        tempStreak = 0;
        prevDate = null;
        continue;
      }

      const currDate = new Date(dStr);
      if (prevDate) {
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = currDate;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // 7. Last 14 Days History for visual streak calendar/dots
  const streakHistory = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toLocaleDateString('en-CA', { timeZone: userTimezone });
    const stats = dayStatsMap.get(dStr) || { count: 0, durationSeconds: 0 };
    const mins = Math.floor(stats.durationSeconds / 60);
    const isMeaningful = stats.count >= 5 || mins >= 10;

    streakHistory.push({
      date: dStr,
      questionsCount: stats.count,
      activeMinutes: mins,
      isMeaningful,
    });
  }

  return {
    currentStreak,
    longestStreak,
    isActiveToday: todayStats.count > 0,
    todayQuestionsCount: todayStats.count,
    todayActiveMinutes: todayMinutes,
    isMeaningfulToday,
    dailyGoalTarget,
    streakHistory,
  };
}
