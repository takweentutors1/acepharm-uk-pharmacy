export interface QuestionOptionPayload {
  label: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  content: string;
  isCorrect: boolean;
  rationale: string;
}

export interface QuestionValidationPayload {
  publicId?: string;
  pathwayId: string;
  primarySubtopicId: string;
  secondarySubtopicIds?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'sba' | 'emq' | 'calculation';
  sector: 'community' | 'hospital' | 'gp' | 'any';
  learningObjective?: string;
  status: 'idea' | 'draft' | 'awaiting_clinical_review' | 'changes_requested' | 'awaiting_editorial_review' | 'approved' | 'scheduled' | 'published' | 'update_required' | 'suspended' | 'archived';
  stem: string;
  leadIn: string;
  options: QuestionOptionPayload[];
  explanation: {
    summaryTakeaway: string;
    detailedExplanation: string;
    clinicalGuidanceReference?: string;
  };
  calculation?: {
    numericAnswer?: string;
    numericTolerance?: string;
    numericUnit?: string;
    decimalPlaces?: number;
    calculatorAllowed?: boolean;
    calculationWorking?: string;
  };
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Validates a question against AcePharm UK Pharmacy Clinical & Section 7.3 Authoring Checklist rules.
 * Enforced unconditionally on the server before database persistence or status transitions.
 */
export function validateQuestion(payload: QuestionValidationPayload, isPublishing = false): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Structural requirements
  if (!payload.pathwayId?.trim()) {
    errors.push({ field: 'pathwayId', message: 'Pathway is required.', severity: 'error' });
  }

  if (!payload.primarySubtopicId?.trim()) {
    errors.push({ field: 'primarySubtopicId', message: 'Primary subtopic is mandatory (exactly one primary subtopic).', severity: 'error' });
  }

  if (!payload.stem?.trim()) {
    errors.push({ field: 'stem', message: 'Clinical vignette / question stem cannot be empty.', severity: 'error' });
  } else if (payload.stem.trim().length < 25 && isPublishing) {
    errors.push({ field: 'stem', message: 'Clinical scenario must provide sufficient detail (min 25 characters).', severity: 'error' });
  }

  if (!payload.leadIn?.trim()) {
    errors.push({ field: 'leadIn', message: 'Lead-in prompt (e.g. "Which is the most appropriate initial therapy?") is required.', severity: 'error' });
  }

  // 2. Option & Rationale validation (Section 7.3 Checklist)
  if (!Array.isArray(payload.options) || payload.options.length < 2) {
    errors.push({ field: 'options', message: 'Question must have at least 2 options (standard SBA requires 5: A through E).', severity: 'error' });
  } else {
    if (payload.questionType === 'sba' && payload.options.length !== 5 && isPublishing) {
      errors.push({ field: 'options', message: 'Standard GPhC SBA questions require exactly 5 options (A–E).', severity: 'error' });
    }

    const correctCount = payload.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      errors.push({ field: 'options', message: 'At least one option must be marked as correct.', severity: 'error' });
    } else if (correctCount > 1 && payload.questionType === 'sba') {
      errors.push({ field: 'options', message: 'SBA questions must have exactly one single best answer (single correct option).', severity: 'error' });
    }

    // MANDATORY PER-OPTION RATIONALE RULE (Rule #3 in Section 7.1 & Section 7.3 checklist)
    payload.options.forEach((opt, idx) => {
      const label = opt.label || `Option ${idx + 1}`;
      if (!opt.content?.trim()) {
        errors.push({ field: `options[${idx}].content`, message: `${label} content cannot be empty.`, severity: 'error' });
      }

      if (!opt.rationale?.trim()) {
        errors.push({
          field: `options[${idx}].rationale`,
          message: `Mandatory Rationale Missing: ${label} (${opt.isCorrect ? 'Correct Answer' : 'Distractor'}) must explain why it is ${opt.isCorrect ? 'the optimal guideline choice' : 'sub-optimal/incorrect'}.`,
          severity: 'error',
        });
      } else if (opt.rationale.trim().length < 10 && isPublishing) {
        errors.push({
          field: `options[${idx}].rationale`,
          message: `${label} rationale is too brief. Please provide a thorough clinical explanation.`,
          severity: 'error',
        });
      }
    });
  }

  // 3. Explanation Validation
  if (!payload.explanation) {
    errors.push({ field: 'explanation', message: 'Explanation object is required.', severity: 'error' });
  } else {
    if (!payload.explanation.summaryTakeaway?.trim()) {
      errors.push({ field: 'explanation.summaryTakeaway', message: 'Summary takeaway / key learning point is required.', severity: 'error' });
    }
    if (!payload.explanation.detailedExplanation?.trim()) {
      errors.push({ field: 'explanation.detailedExplanation', message: 'Detailed clinical explanation is required.', severity: 'error' });
    }
  }

  // 4. Calculation Validation (GPhC Paper 1 Rules)
  if (payload.questionType === 'calculation') {
    if (!payload.calculation?.numericAnswer?.trim() && isPublishing) {
      errors.push({ field: 'calculation.numericAnswer', message: 'Calculation questions must specify the exact numeric answer.', severity: 'error' });
    }
    if (!payload.calculation?.calculationWorking?.trim() && isPublishing) {
      errors.push({ field: 'calculation.calculationWorking', message: 'Step-by-step mathematical working is mandatory for calculations.', severity: 'error' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
