import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, gt } from 'drizzle-orm';
import { 
  questions, 
  questionFirstAttempts, 
  questionAttempts, 
  categories, 
  subtopics 
} from '../db/schema';

export interface ProgressAnalyticsResult {
  // 1. Distinct Accuracy Metrics (Never collapsed into one figure - Section 7.2)
  accuracySplit: {
    firstAttempt: {
      total: number;
      correct: number;
      percentage: number;
    };
    practice: {
      total: number;
      correct: number;
      percentage: number;
    };
    repeat: {
      total: number;
      correct: number;
      percentage: number;
    };
  };

  // 2. Confidence Calibration Matrix (Stated confidence vs actual correctness)
  calibrationMatrix: {
    lowConfidence: {
      total: number;
      correct: number;
      accuracy: number;
    };
    mediumConfidence: {
      total: number;
      correct: number;
      accuracy: number;
    };
    highConfidence: {
      total: number;
      correct: number;
      accuracy: number;
    };
    calibrationSummary: 'underconfident' | 'calibrated' | 'overconfident';
  };

  // 3. Syllabus Coverage Map (% of subtopic questions attempted at least once)
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

/**
 * Calculates distinct progress metrics per Section 7.2 of the Specification:
 * - First-attempt accuracy: from question_first_attempts
 * - Practice accuracy: from question_attempts
 * - Repeat accuracy: from question_attempts where attempt_number > 1
 * - Confidence Calibration: stated low/medium/high vs actual correct
 * - Subtopic Coverage: % attempted at least once with standard status labels (never "mastered")
 */
export async function calculateProgressMetrics(
  db: ReturnType<typeof drizzle>,
  userId: string
): Promise<ProgressAnalyticsResult> {
  // 1. Query First Attempts
  const firstAttempts = await db
    .select()
    .from(questionFirstAttempts)
    .where(eq(questionFirstAttempts.userId, userId));

  const firstTotal = firstAttempts.length;
  const firstCorrect = firstAttempts.filter((a) => a.isCorrect).length;
  const firstPercentage = firstTotal > 0 ? Math.round((firstCorrect / firstTotal) * 100) : 0;

  // 2. Query All Practice Attempts
  const allAttempts = await db
    .select()
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId));

  const practiceTotal = allAttempts.length;
  const practiceCorrect = allAttempts.filter((a) => a.isCorrect).length;
  const practicePercentage = practiceTotal > 0 ? Math.round((practiceCorrect / practiceTotal) * 100) : 0;

  // 3. Query Repeat Attempts (attempt_number > 1)
  const repeatAttempts = allAttempts.filter((a) => (a.attemptNumber || 1) > 1);
  const repeatTotal = repeatAttempts.length;
  const repeatCorrect = repeatAttempts.filter((a) => a.isCorrect).length;
  const repeatPercentage = repeatTotal > 0 ? Math.round((repeatCorrect / repeatTotal) * 100) : 0;

  // 4. Calculate Confidence Calibration Matrix
  const lowAttempts = allAttempts.filter((a) => a.confidence === 'low');
  const medAttempts = allAttempts.filter((a) => a.confidence === 'medium');
  const highAttempts = allAttempts.filter((a) => a.confidence === 'high');

  const lowTotal = lowAttempts.length;
  const lowCorrect = lowAttempts.filter((a) => a.isCorrect).length;
  const lowAcc = lowTotal > 0 ? Math.round((lowCorrect / lowTotal) * 100) : 0;

  const medTotal = medAttempts.length;
  const medCorrect = medAttempts.filter((a) => a.isCorrect).length;
  const medAcc = medTotal > 0 ? Math.round((medCorrect / medTotal) * 100) : 0;

  const highTotal = highAttempts.length;
  const highCorrect = highAttempts.filter((a) => a.isCorrect).length;
  const highAcc = highTotal > 0 ? Math.round((highCorrect / highTotal) * 100) : 0;

  let calibrationSummary: 'underconfident' | 'calibrated' | 'overconfident' = 'calibrated';
  if (highTotal >= 5 && highAcc < 70) {
    calibrationSummary = 'overconfident'; // High confidence with poor accuracy
  } else if (lowTotal >= 5 && lowAcc > 70) {
    calibrationSummary = 'underconfident'; // Low confidence but scoring high
  }

  // 5. Build Syllabus Coverage Map
  const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
  const allSubtopics = await db.select().from(subtopics).orderBy(subtopics.sortOrder);
  const allQuestions = await db.select({ id: questions.id, subtopicId: questions.primarySubtopicId }).from(questions).where(eq(questions.status, 'published'));

  const firstAttemptedQuestionIds = new Set(firstAttempts.map((a) => a.questionId));
  const subtopicMap = new Map<string, typeof allSubtopics>();
  for (const s of allSubtopics) {
    const list = subtopicMap.get(s.categoryId) || [];
    list.push(s);
    subtopicMap.set(s.categoryId, list);
  }

  const coverageMap = allCategories.map((cat) => {
    const catSubs = subtopicMap.get(cat.id) || [];
    let catTotalQ = 0;
    let catAttemptedQ = 0;

    const subtopicStats = catSubs.map((sub) => {
      const subQs = allQuestions.filter((q) => q.subtopicId === sub.id);
      const total = subQs.length;
      const attempted = subQs.filter((q) => firstAttemptedQuestionIds.has(q.id)).length;
      const coveragePercentage = total > 0 ? Math.round((attempted / total) * 100) : 0;

      const subFirstAttempts = firstAttempts.filter((a) => subQs.some((q) => q.id === a.questionId));
      const firstPassCorrect = subFirstAttempts.filter((a) => a.isCorrect).length;
      const firstPassAccuracy = subFirstAttempts.length > 0 ? Math.round((firstPassCorrect / subFirstAttempts.length) * 100) : 0;

      // Status labels, in order: Not started → First pass → Needs attention → Developing → Secure → Due for review
      let statusLabel: 'Not started' | 'First pass' | 'Needs attention' | 'Developing' | 'Secure' | 'Due for review' = 'Not started';
      if (attempted === 0) {
        statusLabel = 'Not started';
      } else if (attempted < total && firstPassAccuracy >= 75) {
        statusLabel = 'Developing';
      } else if (firstPassAccuracy < 60) {
        statusLabel = 'Needs attention';
      } else if (coveragePercentage === 100 && firstPassAccuracy >= 75) {
        statusLabel = 'Secure';
      } else {
        statusLabel = 'First pass';
      }

      catTotalQ += total;
      catAttemptedQ += attempted;

      return {
        id: sub.id,
        name: sub.name,
        total,
        attempted,
        coveragePercentage,
        firstPassAccuracy,
        statusLabel,
      };
    });

    const catCoverage = catTotalQ > 0 ? Math.round((catAttemptedQ / catTotalQ) * 100) : 0;
    let catStatus: 'Not started' | 'First pass' | 'Needs attention' | 'Developing' | 'Secure' | 'Due for review' = 'Not started';
    if (catAttemptedQ === 0) catStatus = 'Not started';
    else if (catCoverage >= 80) catStatus = 'Secure';
    else if (catCoverage >= 40) catStatus = 'Developing';
    else catStatus = 'First pass';

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalQuestions: catTotalQ,
      attemptedQuestions: catAttemptedQ,
      coveragePercentage: catCoverage,
      statusLabel: catStatus,
      subtopics: subtopicStats,
    };
  });

  return {
    accuracySplit: {
      firstAttempt: { total: firstTotal, correct: firstCorrect, percentage: firstPercentage },
      practice: { total: practiceTotal, correct: practiceCorrect, percentage: practicePercentage },
      repeat: { total: repeatTotal, correct: repeatCorrect, percentage: repeatPercentage },
    },
    calibrationMatrix: {
      lowConfidence: { total: lowTotal, correct: lowCorrect, accuracy: lowAcc },
      mediumConfidence: { total: medTotal, correct: medCorrect, accuracy: medAcc },
      highConfidence: { total: highTotal, correct: highCorrect, accuracy: highAcc },
      calibrationSummary,
    },
    coverageMap,
  };
}
