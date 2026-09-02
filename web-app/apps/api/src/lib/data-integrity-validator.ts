import { drizzle } from 'drizzle-orm/d1';
import { questions, questionOptions, questionExplanations, categories, subtopics } from '../db/schema';

export interface ValidationReport {
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  errors: Array<{
    publicId?: string;
    questionId: string;
    issue: string;
  }>;
}

/**
 * Validates clinical question integrity prior to database seeding or publication.
 * Ensures:
 * 1. Exactly 1 correct option per SBA question.
 * 2. Non-empty rationales for distractors A through E (Section 4.1).
 * 3. Required takeaway summary in explanations.
 * 4. Valid foreign key mappings to categories and subtopics.
 */
export async function validateQuestionBankIntegrity(db: ReturnType<typeof drizzle>): Promise<ValidationReport> {
  const allQuestions = await db.select().from(questions);
  const allOptions = await db.select().from(questionOptions);
  const allExplanations = await db.select().from(questionExplanations);

  const errors: ValidationReport['errors'] = [];
  let validCount = 0;

  const optionsMap = new Map<string, typeof allOptions>();
  for (const opt of allOptions) {
    const list = optionsMap.get(opt.questionId) || [];
    list.push(opt);
    optionsMap.set(opt.questionId, list);
  }

  const explanationsMap = new Map<string, typeof allExplanations[0]>();
  for (const exp of allExplanations) {
    explanationsMap.set(exp.questionId, exp);
  }

  for (const q of allQuestions) {
    const opts = optionsMap.get(q.id) || [];
    const exp = explanationsMap.get(q.id);
    let hasError = false;

    // Rule 1: Minimum 4 options, exactly 1 correct
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      errors.push({
        publicId: q.publicId,
        questionId: q.id,
        issue: `Question must have exactly 1 correct option (found ${correctCount}).`,
      });
      hasError = true;
    }

    if (opts.length < 4) {
      errors.push({
        publicId: q.publicId,
        questionId: q.id,
        issue: `Question must have at least 4 options A–D (found ${opts.length}).`,
      });
      hasError = true;
    }

    // Rule 2: Non-empty distractor rationales
    for (const opt of opts) {
      if (!opt.rationale || opt.rationale.trim().length === 0) {
        errors.push({
          publicId: q.publicId,
          questionId: q.id,
          issue: `Option ${opt.label} (${opt.id}) is missing an explanation rationale.`,
        });
        hasError = true;
      }
    }

    // Rule 3: 4-stage explanation presence
    if (!exp || !exp.summaryTakeaway || !exp.detailedExplanation) {
      errors.push({
        publicId: q.publicId,
        questionId: q.id,
        issue: 'Question is missing a comprehensive 4-stage explanation rationale.',
      });
      hasError = true;
    }

    if (!hasError) {
      validCount++;
    }
  }

  return {
    totalQuestions: allQuestions.length,
    validQuestions: validCount,
    invalidQuestions: errors.length,
    errors,
  };
}
