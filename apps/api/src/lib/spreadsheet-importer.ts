import { validateQuestion, type QuestionValidationPayload, type ValidationIssue } from './question-validator';

export interface RawSpreadsheetRow {
  rowNumber: number;
  publicId?: string;
  categoryCode?: string;
  subtopicCode?: string;
  difficulty?: string; // easy, medium, hard
  questionType?: string; // sba, emq, calculation
  sector?: string; // community, hospital, gp, any
  stem?: string;
  leadIn?: string;
  optionA?: string;
  optionARationale?: string;
  optionB?: string;
  optionBRationale?: string;
  optionC?: string;
  optionCRationale?: string;
  optionD?: string;
  optionDRationale?: string;
  optionE?: string;
  optionERationale?: string;
  correctAnswer?: string; // 'A', 'B', 'C', 'D', or 'E'
  summaryTakeaway?: string;
  detailedExplanation?: string;
  guidelineReference?: string;
  numericAnswer?: string;
  numericTolerance?: string;
  calculationWorking?: string;
}

export interface RowValidationReport {
  rowNumber: number;
  publicId: string;
  status: 'valid' | 'invalid';
  errors: string[];
  warnings: string[];
  parsedPayload?: QuestionValidationPayload;
}

export interface SpreadsheetValidationSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rowReports: RowValidationReport[];
}

/**
 * Validates a batch of spreadsheet rows against Section 7.3 and Non-Negotiable Rule #5
 * (Imported questions are NEVER published automatically — committed as 'draft' only).
 */
export function validateSpreadsheetBatch(
  rows: RawSpreadsheetRow[],
  pathwayId: string,
  subtopicCodeToIdMap: Record<string, string>
): SpreadsheetValidationSummary {
  const reports: RowValidationReport[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (const row of rows) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const publicId = row.publicId?.trim() || `ACP-IMP-${row.rowNumber}`;

    // 1. Resolve Subtopic
    const subCode = row.subtopicCode?.toLowerCase().trim();
    const primarySubtopicId = subCode ? subtopicCodeToIdMap[subCode] : undefined;

    if (!primarySubtopicId) {
      errors.push(`Subtopic code "${row.subtopicCode || 'EMPTY'}" could not be matched to a valid curriculum subtopic.`);
    }

    // 2. Validate Difficulty & Types
    const difficulty = (row.difficulty?.toLowerCase().trim() as any) || 'medium';
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      warnings.push(`Unrecognised difficulty "${row.difficulty}", default to "medium".`);
    }

    const questionType = (row.questionType?.toLowerCase().trim() as any) || 'sba';
    const sector = (row.sector?.toLowerCase().trim() as any) || 'any';

    // 3. Assemble Options (A through E)
    const optionsRaw = [
      { label: 'A', content: row.optionA?.trim() || '', rationale: row.optionARationale?.trim() || '' },
      { label: 'B', content: row.optionB?.trim() || '', rationale: row.optionBRationale?.trim() || '' },
      { label: 'C', content: row.optionC?.trim() || '', rationale: row.optionCRationale?.trim() || '' },
      { label: 'D', content: row.optionD?.trim() || '', rationale: row.optionDRationale?.trim() || '' },
      { label: 'E', content: row.optionE?.trim() || '', rationale: row.optionERationale?.trim() || '' },
    ];

    const correctLetter = row.correctAnswer?.toUpperCase().trim();
    if (!['A', 'B', 'C', 'D', 'E'].includes(correctLetter || '')) {
      errors.push(`Correct answer must be explicitly marked as A, B, C, D, or E (received: "${row.correctAnswer || 'EMPTY'}").`);
    }

    const options = optionsRaw.map((opt) => ({
      ...opt,
      isCorrect: opt.label === correctLetter,
    }));

    // 4. Build Structured Payload for Core Validator
    const payload: QuestionValidationPayload = {
      publicId,
      pathwayId,
      primarySubtopicId: primarySubtopicId || '',
      difficulty,
      questionType,
      sector,
      status: 'draft', // Non-Negotiable Rule #5: ALWAYS committed as draft
      stem: row.stem?.trim() || '',
      leadIn: row.leadIn?.trim() || '',
      options,
      explanation: {
        summaryTakeaway: row.summaryTakeaway?.trim() || '',
        detailedExplanation: row.detailedExplanation?.trim() || '',
        clinicalGuidanceReference: row.guidelineReference?.trim() || undefined,
      },
      calculation: {
        numericAnswer: row.numericAnswer?.trim() || undefined,
        numericTolerance: row.numericTolerance?.trim() || undefined,
        calculationWorking: row.calculationWorking?.trim() || undefined,
      },
    };

    // 5. Run Section 7.3 Rule Check
    const result = validateQuestion(payload, false);
    for (const err of result.errors) {
      errors.push(err.message);
    }
    for (const w of result.warnings) {
      warnings.push(w.message);
    }

    if (errors.length === 0) {
      validCount++;
      reports.push({
        rowNumber: row.rowNumber,
        publicId,
        status: 'valid',
        errors: [],
        warnings,
        parsedPayload: payload,
      });
    } else {
      invalidCount++;
      reports.push({
        rowNumber: row.rowNumber,
        publicId,
        status: 'invalid',
        errors,
        warnings,
      });
    }
  }

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    rowReports: reports,
  };
}
