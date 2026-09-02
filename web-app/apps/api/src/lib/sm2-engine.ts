import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte, sql, desc } from 'drizzle-orm';
import { 
  flashcards, 
  questionContent, 
  questionExplanations, 
  questions, 
  subtopics 
} from '../db/schema';
import { generateText } from 'ai';
import { getMimoModel } from './zen-ai-client';

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
  ease: number; // 250 = 2.5 ease factor
  dueAt: Date;
  reviews: number;
  lapses: number;
  isDue: boolean;
}

/**
 * Standard 4-Grade SuperMemo-2 (SM-2) Scheduling Algorithm:
 * - Grade 0 / 'again': Incorrect response -> lapses + 1, interval = 1 day, ease decreases by 20.
 * - Grade 1 / 'hard':  Struggled -> reviews + 1, interval = max(1, interval * 1.2), ease decreases by 15.
 * - Grade 2 / 'good':  Standard correct -> reviews + 1, interval = interval === 1 ? 6 : round(interval * (ease/100)).
 * - Grade 3 / 'easy':  Effortless recall -> reviews + 1, interval = interval === 1 ? 8 : round(interval * (ease/100) * 1.3), ease increases by 15.
 * Minimum ease floor is capped at 130 (1.30).
 */
export function calculateSM2NextReview(
  currentIntervalDays: number,
  currentEase: number,
  reviews: number,
  lapses: number,
  grade: SM2Grade
): {
  nextIntervalDays: number;
  nextEase: number;
  nextReviews: number;
  nextLapses: number;
  nextDueDate: Date;
} {
  let interval = currentIntervalDays;
  let ease = currentEase;
  let r = reviews;
  let l = lapses;

  switch (grade) {
    case 'again':
      interval = 1;
      ease = Math.max(130, ease - 20);
      l += 1;
      break;

    case 'hard':
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(130, ease - 15);
      r += 1;
      break;

    case 'good':
      if (r === 0) {
        interval = 1;
      } else if (r === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * (ease / 100));
      }
      r += 1;
      break;

    case 'easy':
      if (r === 0) {
        interval = 4;
      } else if (r === 1) {
        interval = 8;
      } else {
        interval = Math.round(interval * (ease / 100) * 1.3);
      }
      ease += 15;
      r += 1;
      break;
  }

  const nextDueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

  return {
    nextIntervalDays: interval,
    nextEase: ease,
    nextReviews: r,
    nextLapses: l,
    nextDueDate,
  };
}

/**
 * Generates an active clinical flashcard directly from a question explanation or BNF core concept.
 */
export async function generateFlashcardFromQuestion(
  db: ReturnType<typeof drizzle>,
  userId: string,
  questionId: string,
  zenApiKey?: string
): Promise<FlashcardItem> {
  // Check if card already exists for this question + user
  const [existing] = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.userId, userId), eq(flashcards.questionId, questionId)))
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      questionId: existing.questionId,
      subtopicId: existing.subtopicId,
      frontPrompt: existing.frontPrompt,
      backAnswer: existing.backAnswer,
      intervalDays: existing.intervalDays,
      ease: existing.ease,
      dueAt: existing.dueAt,
      reviews: existing.reviews,
      lapses: existing.lapses,
      isDue: existing.dueAt.getTime() <= Date.now(),
    };
  }

  const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
  const [content] = await db.select().from(questionContent).where(eq(questionContent.questionId, questionId)).limit(1);
  const [explanation] = await db.select().from(questionExplanations).where(eq(questionExplanations.questionId, questionId)).limit(1);

  const conceptPrompt = content?.stem || 'Clinical pharmacy concept';
  const conceptKeyPoint = explanation?.detailedExplanation?.split('\n')[0] || 'Key clinical pearl';

  let frontPrompt = `What is the key clinical principle regarding: "${conceptPrompt.slice(0, 100)}..."?`;
  let backAnswer = conceptKeyPoint;

  try {
    const model = getMimoModel(zenApiKey);
    const result = await generateText({
      model,
      system: 'You are Ace, generating a high-yield UK clinical pharmacy flashcard from a question. Return JSON only with "frontPrompt" and "backAnswer". Keep backAnswer under 40 words.',
      prompt: `Stem: ${content?.stem}\nExplanation: ${explanation?.detailedExplanation}`,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.frontPrompt && parsed.backAnswer) {
        frontPrompt = parsed.frontPrompt;
        backAnswer = parsed.backAnswer;
      }
    }
  } catch (err) {
    console.warn('Zen flashcard generation fallback:', err);
  }

  const cardId = `card-${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(flashcards).values({
    id: cardId,
    userId,
    questionId,
    subtopicId: question?.primarySubtopicId || null,
    frontPrompt,
    backAnswer,
    intervalDays: 1,
    ease: 250,
    dueAt: now,
    reviews: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: cardId,
    userId,
    questionId,
    subtopicId: question?.primarySubtopicId || null,
    frontPrompt,
    backAnswer,
    intervalDays: 1,
    ease: 250,
    dueAt: now,
    reviews: 0,
    lapses: 0,
    isDue: true,
  };
}

/**
 * Fetches all due and upcoming flashcards for a user.
 */
export async function getUserFlashcards(
  db: ReturnType<typeof drizzle>,
  userId: string,
  onlyDue: boolean = false
): Promise<{ dueCards: FlashcardItem[]; upcomingCards: FlashcardItem[]; totalCount: number }> {
  const allCards = await db
    .select()
    .from(flashcards)
    .where(eq(flashcards.userId, userId))
    .orderBy(flashcards.dueAt);

  const subtopicRows = await db.select({ id: subtopics.id, name: subtopics.name }).from(subtopics);
  const subtopicMap = new Map(subtopicRows.map((s) => [s.id, s.name]));

  const nowMs = Date.now();
  const mappedCards: FlashcardItem[] = allCards.map((c) => ({
    id: c.id,
    userId: c.userId,
    questionId: c.questionId,
    subtopicId: c.subtopicId,
    subtopicName: c.subtopicId ? subtopicMap.get(c.subtopicId) || null : null,
    frontPrompt: c.frontPrompt,
    backAnswer: c.backAnswer,
    intervalDays: c.intervalDays,
    ease: c.ease,
    dueAt: c.dueAt,
    reviews: c.reviews,
    lapses: c.lapses,
    isDue: c.dueAt.getTime() <= nowMs,
  }));

  const dueCards = mappedCards.filter((c) => c.isDue);
  const upcomingCards = mappedCards.filter((c) => !c.isDue);

  return {
    dueCards,
    upcomingCards,
    totalCount: mappedCards.length,
  };
}

/**
 * Submits a 4-grade review for a flashcard and schedules its next occurrence.
 */
export async function submitFlashcardReview(
  db: ReturnType<typeof drizzle>,
  cardId: string,
  grade: SM2Grade
): Promise<FlashcardItem | null> {
  const [card] = await db.select().from(flashcards).where(eq(flashcards.id, cardId)).limit(1);
  if (!card) return null;

  const next = calculateSM2NextReview(
    card.intervalDays,
    card.ease,
    card.reviews,
    card.lapses,
    grade
  );

  const now = new Date();
  await db
    .update(flashcards)
    .set({
      intervalDays: next.nextIntervalDays,
      ease: next.nextEase,
      reviews: next.nextReviews,
      lapses: next.nextLapses,
      dueAt: next.nextDueDate,
      updatedAt: now,
    })
    .where(eq(flashcards.id, cardId));

  return {
    id: card.id,
    userId: card.userId,
    questionId: card.questionId,
    subtopicId: card.subtopicId,
    frontPrompt: card.frontPrompt,
    backAnswer: card.backAnswer,
    intervalDays: next.nextIntervalDays,
    ease: next.nextEase,
    dueAt: next.nextDueDate,
    reviews: next.nextReviews,
    lapses: next.nextLapses,
    isDue: next.nextDueDate.getTime() <= Date.now(),
  };
}
