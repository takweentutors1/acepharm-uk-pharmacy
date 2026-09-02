import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { questions, questionContent, questionExplanations } from '../db/schema';
import { generateText } from 'ai';
import { getMimoModel } from './zen-ai-client';

export interface CalculationCoachDiagnostics {
  questionId: string;
  isCorrect: boolean;
  brokenStepIndex: number | null;
  brokenStepDescription: string;
  remediationAdvice: string;
  groundedWorking: string;
  alternativeMethodsAccepted: boolean;
}

/**
 * Calculation Coach (Section 5.2):
 * - Grounded strictly in the stored `calculation_working` field of the question.
 * - Parses student working steps against reference steps.
 * - Identifies precisely which line broke (e.g. unit conversion error, infusion rate formula inverted, dilution error).
 * - Accepts valid alternative algebraic or ratio-and-proportion methods.
 */
export async function diagnoseCalculationWorking(
  db: ReturnType<typeof drizzle>,
  questionId: string,
  studentWorking: string,
  studentNumericAnswer?: number,
  zenApiKey?: string
): Promise<CalculationCoachDiagnostics> {
  // 1. Fetch official question content and stored calculation working
  const [content] = await db
    .select()
    .from(questionContent)
    .where(eq(questionContent.questionId, questionId))
    .limit(1);

  const [explanation] = await db
    .select()
    .from(questionExplanations)
    .where(eq(questionExplanations.questionId, questionId))
    .limit(1);

  const officialWorking = content?.calculationWorking || explanation?.detailedExplanation || 'Official step-by-step working not specified.';
  const officialAnswer = content?.numericAnswer;
  const unit = content?.numericUnit || '';

  const isNumericMatch = officialAnswer !== null && officialAnswer !== undefined && studentNumericAnswer !== undefined
    ? Math.abs(studentNumericAnswer - Number(officialAnswer)) <= (Number(content?.numericTolerance) || 0.01)
    : false;

  const prompt = `
You are the Ace Calculation Coach for UK GPhC pharmacy calculations.

### Question Stem:
${content?.stem || 'Calculation scenario'}

### Official Model Working (Grounded Baseline):
${officialWorking}
Official Answer: ${officialAnswer} ${unit}

### Learner's Submitted Working:
"${studentWorking}"
Learner's Final Answer: ${studentNumericAnswer ?? 'Not provided'} ${unit}

### Your Task:
1. Examine the learner's steps line-by-line against the official model working.
2. Check for common calculation traps:
   - Unit conversion error (e.g. mg to mcg, mL to L, % w/v confusion)
   - Inverted fraction or rate formula (e.g. rate in mL/hour vs mL/minute)
   - Displacement volume omitted
   - Body weight / surface area scaling mistake
   - Rounding prematurely before final step
3. Note: If the learner used a valid alternative calculation method (e.g. dimensional analysis vs unitary method vs formula), ACCEPT it as valid if mathematically sound.
4. Pinpoint the exact line or step where the calculation broke (or state that the working is fully correct).
5. Format your output strictly in JSON:
{
  "isCorrect": boolean,
  "brokenStepIndex": number or null,
  "brokenStepDescription": "Brief description of the specific error (or 'Working is sound')",
  "remediationAdvice": "Clear 2-sentence guidance explaining how to fix the broken step and avoid this GPhC calculation trap.",
  "alternativeMethodsAccepted": true
}
  `.trim();

  try {
    const model = getMimoModel(zenApiKey);
    const result = await generateText({
      model,
      system: 'You are the Ace Calculation Coach. Respond with valid JSON only.',
      prompt,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        questionId,
        isCorrect: isNumericMatch || Boolean(parsed.isCorrect),
        brokenStepIndex: parsed.brokenStepIndex ?? null,
        brokenStepDescription: parsed.brokenStepDescription || 'Analysis complete.',
        remediationAdvice: parsed.remediationAdvice || 'Review the official working steps above.',
        groundedWorking: officialWorking,
        alternativeMethodsAccepted: true,
      };
    }
  } catch (err) {
    console.warn('Calculation coach AI diagnosis fallback:', err);
  }

  // Deterministic fallback diagnostic
  return {
    questionId,
    isCorrect: isNumericMatch,
    brokenStepIndex: isNumericMatch ? null : 1,
    brokenStepDescription: isNumericMatch 
      ? 'Your working arrived at the correct clinical calculation answer.' 
      : `Discrepancy detected in final quantity calculation (expected ${officialAnswer} ${unit}).`,
    remediationAdvice: isNumericMatch
      ? 'Excellent mathematical working. Always remember to check unit dimensions at the final step.'
      : 'Verify your intermediate unit conversions and ensure you did not round intermediate values before the final calculation.',
    groundedWorking: officialWorking,
    alternativeMethodsAccepted: true,
  };
}
