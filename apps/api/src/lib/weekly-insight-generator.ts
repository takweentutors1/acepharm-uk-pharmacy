import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { 
  users, 
  questionFirstAttempts, 
  questionAttempts, 
  questions, 
  subtopics, 
  categories 
} from '../db/schema';
import { generateText } from 'ai';
import { getMimoModel } from './zen-ai-client';

export interface WeeklyInsightSummary {
  userId: string;
  totalAttemptsThisWeek: number;
  accuracyThisWeek: number;
  confidentlyIncorrectCount: number;
  confidentlyIncorrectTopics: string[];
  weakestCategoryName?: string;
  strongestCategoryName?: string;
  insightParagraph: string;
  generatedAt: string;
}

/**
 * Calculates a learner's performance over the last 7 days and identifies
 * "confidently incorrect" answers (high confidence rating but wrong answer).
 */
export async function calculateLearnerWeeklyData(
  db: ReturnType<typeof drizzle>,
  userId: string
) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch attempts in the last 7 days
  const recentAttempts = await db
    .select({
      id: questionAttempts.id,
      isCorrect: questionAttempts.isCorrect,
      confidence: questionAttempts.confidence,
      questionId: questionAttempts.questionId,
    })
    .from(questionAttempts)
    .where(
      and(
        eq(questionAttempts.userId, userId),
        gte(questionAttempts.answeredAt, sevenDaysAgo)
      )
    );

  if (recentAttempts.length === 0) {
    return null;
  }

  const totalAttempts = recentAttempts.length;
  const correctAttempts = recentAttempts.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correctAttempts / totalAttempts) * 100);

  // 2. Identify "Confidently Incorrect" answers (confidence = 'high' and isCorrect = false)
  const confidentlyIncorrect = recentAttempts.filter(
    (a) => !a.isCorrect && a.confidence === 'high'
  );

  let highRiskSubtopics: string[] = [];
  if (confidentlyIncorrect.length > 0) {
    const qIds = confidentlyIncorrect.map((a) => a.questionId);
    const matchedQuestions = await db
      .select({
        subtopicId: questions.primarySubtopicId,
      })
      .from(questions)
      .where(sql`${questions.id} IN (${sql.join(qIds.map((id) => sql`${id}`), sql`, `)})`);

    const subtopicIds = [...new Set(matchedQuestions.map((q) => q.subtopicId).filter(Boolean))];
    if (subtopicIds.length > 0) {
      const subtopicRows = await db
        .select({ name: subtopics.name })
        .from(subtopics)
        .where(sql`${subtopics.id} IN (${sql.join(subtopicIds.map((id) => sql`${id}`), sql`, `)})`);

      highRiskSubtopics = subtopicRows.map((s) => s.name);
    }
  }

  return {
    totalAttempts,
    correctAttempts,
    accuracy,
    confidentlyIncorrectCount: confidentlyIncorrect.length,
    confidentlyIncorrectTopics: highRiskSubtopics,
  };
}

/**
 * Generates a focused, encouraging, one-paragraph weekly revision insight.
 * CRITICAL RULE (Section 5.2): Leads with "confidently incorrect" answers whenever they exist.
 */
export async function generateSingleWeeklyInsight(
  db: ReturnType<typeof drizzle>,
  userId: string,
  userName: string,
  zenApiKey?: string
): Promise<WeeklyInsightSummary | null> {
  const learnerData = await calculateLearnerWeeklyData(db, userId);
  if (!learnerData) {
    return {
      userId,
      totalAttemptsThisWeek: 0,
      accuracyThisWeek: 0,
      confidentlyIncorrectCount: 0,
      confidentlyIncorrectTopics: [],
      insightParagraph: 'No questions recorded this week. Complete at least one 10-question practice drill to unlock your personalized weekly clinical insight.',
      generatedAt: new Date().toISOString(),
    };
  }

  let prompt = `
Generate a concise, 2-to-3 sentence British English clinical coaching insight for pharmacy student "${userName}".
Weekly stats:
- Questions answered this week: ${learnerData.totalAttempts}
- Working accuracy: ${learnerData.accuracy}%
- Confidently incorrect answers (high confidence but incorrect): ${learnerData.confidentlyIncorrectCount}
${learnerData.confidentlyIncorrectTopics.length > 0 ? `- Confidently incorrect clinical subtopics: ${learnerData.confidentlyIncorrectTopics.join(', ')}` : ''}

Rules:
1. If confidently incorrect answers > 0, you MUST lead directly with them: high-confidence errors represent critical examination blind spots and look-alike sound-alike clinical risks. Emphasize reviewing the underlying BNF/NICE guidance.
2. If no confidently incorrect answers, praise good calibration and encourage maintaining consistent 20-question daily practice.
3. Keep it strictly to one punchy paragraph (under 75 words). Do not use bullet points or markdown headings.
  `.trim();

  let insightText = '';
  try {
    const model = getMimoModel(zenApiKey);
    const result = await generateText({
      model,
      system: 'You are Ace, an encouraging and rigorous UK clinical pharmacy mentor. Write in natural British English.',
      prompt,
    });
    insightText = result.text.trim();
  } catch (err) {
    // Deterministic fallback if model call is unavailable
    if (learnerData.confidentlyIncorrectCount > 0) {
      insightText = `This week you logged ${learnerData.confidentlyIncorrectCount} answer${learnerData.confidentlyIncorrectCount > 1 ? 's' : ''} with high confidence that turned out incorrect${learnerData.confidentlyIncorrectTopics.length > 0 ? ` (notably across ${learnerData.confidentlyIncorrectTopics.slice(0, 2).join(' and ')})` : ''}. Review these specific guidance summaries in your next study block, as high-confidence misconceptions are the most critical blind spots in the GPhC registration assessment.`;
    } else {
      insightText = `Great calibration this week across ${learnerData.totalAttempts} questions with a ${learnerData.accuracy}% working score and zero high-confidence mistakes. Keep up this disciplined approach and aim for your daily goal to secure your foundation knowledge.`;
    }
  }

  return {
    userId,
    totalAttemptsThisWeek: learnerData.totalAttempts,
    accuracyThisWeek: learnerData.accuracy,
    confidentlyIncorrectCount: learnerData.confidentlyIncorrectCount,
    confidentlyIncorrectTopics: learnerData.confidentlyIncorrectTopics,
    insightParagraph: insightText,
    generatedAt: new Date().toISOString(),
  };
}

import { 
  sendTransactionalEmail, 
  generateWeeklyRevisionSummaryEmail,
  type EmailEnvironment 
} from './email-service';

/**
 * Cron Execution Handler: Runs across active users, generates insights,
 * caches results into KV, and dispatches the weekly summary email to the student.
 */
export async function runWeeklyInsightCron(
  db: ReturnType<typeof drizzle>,
  kvCache?: KVNamespace,
  zenApiKey?: string,
  emailEnv?: EmailEnvironment
): Promise<{ processed: number; cached: number; emailsSent: number }> {
  // Fetch active students
  const activeUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
    })
    .from(users)
    .where(eq(users.status, 'active'))
    .limit(100);

  let processed = 0;
  let cached = 0;
  let emailsSent = 0;

  for (const user of activeUsers) {
    processed++;
    const insight = await generateSingleWeeklyInsight(
      db,
      user.id,
      user.firstName || 'Learner',
      zenApiKey
    );

    if (insight && kvCache) {
      try {
        await kvCache.put(
          `ace_weekly_insight:${user.id}`,
          JSON.stringify(insight),
          { expirationTtl: 86400 * 8 } // 8-day retention
        );
        cached++;
      } catch (err) {
        console.warn(`Failed to cache weekly insight for user ${user.id}:`, err);
      }
    }

    // Dispatch branded weekly digest email if student has active questions and emailEnv is present
    if (insight && insight.totalAttemptsThisWeek > 0 && user.email && emailEnv) {
      try {
        const emailContent = generateWeeklyRevisionSummaryEmail({
          learnerName: user.firstName || 'Learner',
          totalQuestionsAnswered: insight.totalAttemptsThisWeek,
          accuracyPercentage: insight.accuracyThisWeek,
          currentStreakDays: Math.min(insight.totalAttemptsThisWeek > 10 ? 7 : 3, 7),
          topAreaToImprove: insight.weakestCategoryName || 'High-Weight BNF Clinical Topics',
        });

        await sendTransactionalEmail(emailEnv, {
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        emailsSent++;
      } catch (emailErr) {
        console.warn(`Could not dispatch weekly digest email to ${user.email}:`, emailErr);
      }
    }
  }

  return { processed, cached, emailsSent };
}

