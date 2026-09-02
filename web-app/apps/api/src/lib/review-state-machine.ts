/**
 * Section 7.4 Review State Machine & Governance Checklists
 */

export type QuestionStatus =
  | 'idea'
  | 'draft'
  | 'awaiting_clinical_review'
  | 'changes_requested'
  | 'awaiting_editorial_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'update_required'
  | 'suspended'
  | 'archived';

/**
 * Valid Status Transitions Matrix
 */
export const VALID_STATUS_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  idea: ['draft', 'archived'],
  draft: ['awaiting_clinical_review', 'archived'],
  awaiting_clinical_review: ['changes_requested', 'awaiting_editorial_review', 'draft', 'archived'],
  changes_requested: ['draft', 'awaiting_clinical_review', 'archived'],
  awaiting_editorial_review: ['changes_requested', 'approved', 'draft', 'archived'],
  approved: ['scheduled', 'published', 'changes_requested', 'archived'],
  scheduled: ['published', 'approved', 'suspended', 'archived'],
  published: ['update_required', 'suspended', 'archived'],
  update_required: ['draft', 'awaiting_clinical_review', 'archived'],
  suspended: ['published', 'draft', 'archived'],
  archived: ['draft'],
};

/**
 * 1. Clinical Review Checklist (Section 7.4)
 * Completed by registered pharmacist / clinical reviewer
 */
export interface ClinicalChecklist {
  clinicalAccuracyVerified: boolean; // Aligns with BNF, NICE guidelines, SPCs
  singleDefinitiveAnswer: boolean; // Exactly one unequivocally correct answer
  distractorsClinicallyPlausible: boolean; // Plausible clinical errors / near-misses
  perOptionRationalesAccurate: boolean; // Every option explains clinical rationale accurately
  dosingAndCalculationsChecked: boolean; // Renally-adjusted dosing / units verified
  noPatientHarmOrAmbiguity: boolean; // No unsafe clinical advice or misleading prompts
}

/**
 * 2. Educational Review Checklist (Section 7.4)
 * Completed by educational reviewer
 */
export interface EducationalChecklist {
  alignedToGPhCFramework: boolean; // Matches GPhC indicative syllabus & learning outcomes
  appropriateCognitiveLevel: boolean; // Bloom's taxonomy: application & evaluation over pure recall
  leadInUnambiguous: boolean; // No double negatives or confusing sentence structures
  stemContainsRealisticContext: boolean; // Sufficient realistic patient vignette without trivial clues
  explanationHasClearTakeaway: boolean; // Standalone learning point that reinforces core concepts
}

/**
 * 3. Editorial / Copy Review Checklist (Section 7.4)
 * Completed by copy editor / content lead
 */
export interface EditorialChecklist {
  britishEnglishGrammarSpelling: boolean; // en-GB spelling (paediatric, licence, hypokalaemia)
  consistentFormattingAndStyle: boolean; // Standard typography, unit capitalization (mg, mL)
  guidelineCitationsFormatted: boolean; // BNF / NICE references accurately cited with dates
  tablesProperlyStructured: boolean; // Accessible markdown table markup with header rows
  disclaimerAndToneCompliant: boolean; // Meets brand voice, no unverified guarantees
}

export interface ReviewSubmissionPayload {
  questionId: string;
  targetStatus: QuestionStatus;
  reviewType: 'clinical' | 'educational' | 'editorial';
  checklist: ClinicalChecklist | EducationalChecklist | EditorialChecklist;
  feedbackNotes?: string;
  conflictOfInterest?: boolean;
  conflictDetails?: string;
}

export function validateChecklistCompletion(
  reviewType: 'clinical' | 'educational' | 'editorial',
  checklist: Record<string, boolean>
): { complete: boolean; missingItems: string[] } {
  const missingItems: string[] = [];

  for (const [key, value] of Object.entries(checklist)) {
    if (!value) {
      missingItems.push(key);
    }
  }

  return {
    complete: missingItems.length === 0,
    missingItems,
  };
}
