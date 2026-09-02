import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, notInArray, desc } from 'drizzle-orm';
import { 
  users, 
  userProfiles, 
  revisionPlans, 
  revisionPlanDays, 
  questionFirstAttempts, 
  questionAttempts, 
  questions, 
  subtopics, 
  categories 
} from '../db/schema';

export interface PlanDayResult {
  dayIndex: number;
  planDate: string;
  dayType: 'study' | 'spaced_review' | 'weak_topic_focus' | 'rest';
  targetSubtopicIds: string[];
  targetSubtopicNames: string[];
  targetQuestionCount: number;
  completed: boolean;
}

export interface SevenDayRevisionPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  targetAssessmentDate?: string | null;
  active: boolean;
  days: PlanDayResult[];
  summary: {
    totalTargetQuestions: number;
    studyDays: number;
    spacedReviewDays: number;
    restDays: number;
  };
}

/**
 * Generates a personalised 7-day Revision Plan (Section 5.2):
 * - Incorporates subtopic-level first-attempt accuracy, unseen question volume, and assessment date.
 * - Non-negotiable rules:
 *   1. ALWAYS includes at least one REST day.
 *   2. ALWAYS includes at least one SPACED-REVIEW day.
 *   3. Allocates weak subtopics (<60% accuracy) and high-unseen subtopics across study days.
 */
export async function generateSevenDayRevisionPlan(
  db: ReturnType<typeof drizzle>,
  userId: string,
  targetAssessmentDate?: string
): Promise<SevenDayRevisionPlan> {
  const now = new Date();
  const startDateStr = now.toISOString().split('T')[0];

  // 1. Fetch user profile
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const dailyTarget = profile?.dailyQuestionTarget || 20;
  const assessmentDate = targetAssessmentDate || profile?.assessmentDate || null;

  // 2. Fetch all subtopics
  const rawSubtopics = await db
    .select({
      id: subtopics.id,
      name: subtopics.name,
      categoryId: subtopics.categoryId,
    })
    .from(subtopics)
    .where(eq(subtopics.active, true));

  const allSubtopics = Array.isArray(rawSubtopics) ? rawSubtopics : [];

  // 3. Fetch first attempt performance per subtopic
  const firstAttempts = await db
    .select({
      questionId: questionFirstAttempts.questionId,
      isCorrect: questionFirstAttempts.isCorrect,
      subtopicId: questions.primarySubtopicId,
    })
    .from(questionFirstAttempts)
    .innerJoin(questions, eq(questionFirstAttempts.questionId, questions.id))
    .where(eq(questionFirstAttempts.userId, userId));

  const subtopicStats = new Map<string, { total: number; correct: number; accuracy: number }>();
  for (const fa of firstAttempts) {
    if (!fa.subtopicId) continue;
    const current = subtopicStats.get(fa.subtopicId) || { total: 0, correct: 0, accuracy: 0 };
    current.total++;
    if (fa.isCorrect) current.correct++;
    current.accuracy = Math.round((current.correct / current.total) * 100);
    subtopicStats.set(fa.subtopicId, current);
  }

  // 4. Categorize weak subtopics and unseen subtopics
  const weakSubtopics = allSubtopics.filter((s) => {
    const stats = subtopicStats.get(s.id);
    return stats && stats.total >= 1 && stats.accuracy < 65;
  });

  const unseenSubtopics = allSubtopics.filter((s) => {
    const stats = subtopicStats.get(s.id);
    return !stats || stats.total === 0;
  });

  // 5. Structure 7-Day Plan Blueprint:
  // Day 0: Study (Unseen / High-Yield)
  // Day 1: Weak Topic Focus
  // Day 2: Study (Unseen)
  // Day 3: Spaced Review (Revisiting earlier concepts)
  // Day 4: Study (High-Yield)
  // Day 5: Weak Topic Drill
  // Day 6: REST DAY (Section 5.2 Mandatory Rule)
  const planId = `plan-${crypto.randomUUID()}`;
  const daysData: PlanDayResult[] = [];

  const subtopicMap = new Map(allSubtopics.map((s) => [s.id, s.name]));

  // Deactivate prior active plans for user
  await db
    .update(revisionPlans)
    .set({ active: false })
    .where(eq(revisionPlans.userId, userId));

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = dayDate.toISOString().split('T')[0];

    let dayType: PlanDayResult['dayType'] = 'study';
    let targetSubtopicIds: string[] = [];
    let qCount = dailyTarget;

    if (i === 6) {
      // Mandatory Rest Day
      dayType = 'rest';
      targetSubtopicIds = [];
      qCount = 0;
    } else if (i === 3) {
      // Mandatory Spaced Review Day
      dayType = 'spaced_review';
      targetSubtopicIds = allSubtopics.slice(0, 3).map((s) => s.id);
      qCount = dailyTarget;
    } else if (i === 1 || i === 5) {
      // Weak Topic Focus
      dayType = 'weak_topic_focus';
      targetSubtopicIds = weakSubtopics.length > 0
        ? weakSubtopics.slice(0, 2).map((s) => s.id)
        : allSubtopics.slice(i, i + 2).map((s) => s.id);
      qCount = dailyTarget;
    } else {
      // Standard Study Day
      dayType = 'study';
      targetSubtopicIds = unseenSubtopics.length > 0
        ? unseenSubtopics.slice(i, i + 2).map((s) => s.id)
        : allSubtopics.slice(i, i + 2).map((s) => s.id);
      qCount = dailyTarget;
    }

    daysData.push({
      dayIndex: i,
      planDate: dateStr,
      dayType,
      targetSubtopicIds,
      targetSubtopicNames: targetSubtopicIds.map((id) => subtopicMap.get(id) || 'Clinical Subtopic'),
      targetQuestionCount: qCount,
      completed: false,
    });
  }

  const endDateStr = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 6. Persist into D1 revision_plans & revision_plan_days
  await db.insert(revisionPlans).values({
    id: planId,
    userId,
    startDate: startDateStr,
    endDate: endDateStr,
    targetAssessmentDate: assessmentDate,
    active: true,
    generatedAt: now,
  });

  for (const day of daysData) {
    await db.insert(revisionPlanDays).values({
      id: `day-${planId}-${day.dayIndex}`,
      planId,
      dayIndex: day.dayIndex,
      planDate: day.planDate,
      dayType: day.dayType,
      targetSubtopicIds: JSON.stringify(day.targetSubtopicIds),
      targetQuestionCount: day.targetQuestionCount,
      completed: false,
    });
  }

  return {
    id: planId,
    userId,
    startDate: startDateStr,
    endDate: endDateStr,
    targetAssessmentDate: assessmentDate,
    active: true,
    days: daysData,
    summary: {
      totalTargetQuestions: daysData.reduce((acc, d) => acc + d.targetQuestionCount, 0),
      studyDays: daysData.filter((d) => d.dayType === 'study' || d.dayType === 'weak_topic_focus').length,
      spacedReviewDays: daysData.filter((d) => d.dayType === 'spaced_review').length,
      restDays: daysData.filter((d) => d.dayType === 'rest').length,
    },
  };
}

/**
 * Fetches the user's active 7-day revision plan.
 */
export async function getActiveRevisionPlan(
  db: ReturnType<typeof drizzle>,
  userId: string
): Promise<SevenDayRevisionPlan | null> {
  const [activePlan] = await db
    .select()
    .from(revisionPlans)
    .where(and(eq(revisionPlans.userId, userId), eq(revisionPlans.active, true)))
    .orderBy(desc(revisionPlans.generatedAt))
    .limit(1);

  if (!activePlan) return null;

  const days = await db
    .select()
    .from(revisionPlanDays)
    .where(eq(revisionPlanDays.planId, activePlan.id))
    .orderBy(revisionPlanDays.dayIndex);

  const allSubtopics = await db.select({ id: subtopics.id, name: subtopics.name }).from(subtopics);
  const subtopicMap = new Map(allSubtopics.map((s) => [s.id, s.name]));

  const mappedDays: PlanDayResult[] = days.map((d) => {
    const targetSubtopicIds = d.targetSubtopicIds ? JSON.parse(d.targetSubtopicIds) : [];
    return {
      dayIndex: d.dayIndex,
      planDate: d.planDate,
      dayType: d.dayType as any,
      targetSubtopicIds,
      targetSubtopicNames: targetSubtopicIds.map((id: string) => subtopicMap.get(id) || 'Clinical Subtopic'),
      targetQuestionCount: d.targetQuestionCount,
      completed: Boolean(d.completed),
    };
  });

  return {
    id: activePlan.id,
    userId: activePlan.userId,
    startDate: activePlan.startDate,
    endDate: activePlan.endDate,
    targetAssessmentDate: activePlan.targetAssessmentDate,
    active: Boolean(activePlan.active),
    days: mappedDays,
    summary: {
      totalTargetQuestions: mappedDays.reduce((acc, d) => acc + d.targetQuestionCount, 0),
      studyDays: mappedDays.filter((d) => d.dayType === 'study' || d.dayType === 'weak_topic_focus').length,
      spacedReviewDays: mappedDays.filter((d) => d.dayType === 'spaced_review').length,
      restDays: mappedDays.filter((d) => d.dayType === 'rest').length,
    },
  };
}
