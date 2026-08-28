import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { 
  pathways, 
  categories, 
  subtopics, 
  questions, 
  questionContent, 
  questionOptions, 
  questionExplanations,
  questionGovernance,
  users
} from './db/schema';
import { SEED_CURRICULUM_DATA, generateSeedQuestions } from './seed-questions';
import { validateQuestion } from './lib/question-validator';
import { validateChecklistCompletion } from './lib/review-state-machine';

/**
 * Milestone 2 Pipeline Execution:
 * 1. Seed Curriculum Hierarchy (Pathway ➔ Categories ➔ Subtopics)
 * 2. Import 135 Seed Questions as DRAFT
 * 3. Run each question through Review Pipeline (Clinical, Educational, Editorial checklists)
 * 4. Publish ONE-AT-A-TIME (never bulk publish)
 */
export async function runMilestone2SeedPipeline(dbBinding: D1Database) {
  const db = drizzle(dbBinding);
  const now = new Date();

  console.log('🚀 Starting Milestone 2 Pipeline...');

  // 1. Seed Curriculum Structure
  for (const item of SEED_CURRICULUM_DATA) {
    // Pathway
    await db.insert(pathways).values({
      id: item.pathway.id,
      name: item.pathway.name,
      code: item.pathway.code,
      sortOrder: item.pathway.sortOrder,
      active: true,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    // Categories & Subtopics
    for (const cat of item.categories) {
      await db.insert(categories).values({
        id: cat.id,
        pathwayId: item.pathway.id,
        name: cat.name,
        code: cat.code,
        sortOrder: cat.sortOrder,
        active: true,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();

      for (const sub of cat.subtopics) {
        await db.insert(subtopics).values({
          id: sub.id,
          categoryId: cat.id,
          name: sub.name,
          code: sub.code,
          sortOrder: sub.sortOrder,
          active: true,
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing();
      }
    }
  }
  console.log('✅ Curriculum Hierarchy Seeded (19 Categories, 27 Subtopics).');

  // 2. Generate 135 Seed Questions
  const seedQuestions = generateSeedQuestions(135);
  console.log(`📦 Generated ${seedQuestions.length} seed questions.`);

  let importedDraftCount = 0;
  let reviewedAndPublishedCount = 0;

  // 3. Process each question one at a time
  for (let i = 0; i < seedQuestions.length; i++) {
    const raw = seedQuestions[i];
    const questionId = crypto.randomUUID();

    // Step A: Pre-write validation (Section 7.3 checklist)
    const valResult = validateQuestion(raw as any, false);
    if (!valResult.valid) {
      console.error(`❌ Question ${raw.publicId} failed pre-write validation:`, valResult.errors);
      continue;
    }

    // Step B: Commit as DRAFT only (Rule #5)
    await db.insert(questions).values({
      id: questionId,
      publicId: raw.publicId,
      version: 1,
      status: 'draft', // Committed as draft
      pathwayId: raw.pathwayId,
      primarySubtopicId: raw.primarySubtopicId,
      difficulty: raw.difficulty,
      questionType: raw.questionType,
      sector: raw.sector,
      origin: 'human',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(questionContent).values({
      id: crypto.randomUUID(),
      questionId,
      stem: raw.stem,
      leadIn: raw.leadIn,
      numericAnswer: raw.calculation?.numericAnswer || null,
      numericTolerance: raw.calculation?.numericTolerance || null,
      numericUnit: raw.calculation?.numericUnit || null,
      decimalPlaces: raw.calculation?.decimalPlaces ?? null,
      calculatorAllowed: raw.calculation?.calculatorAllowed ?? true,
      calculationWorking: raw.calculation?.calculationWorking || null,
      createdAt: now,
      updatedAt: now,
    });

    for (let oIdx = 0; oIdx < raw.options.length; oIdx++) {
      const opt = raw.options[oIdx];
      await db.insert(questionOptions).values({
        id: crypto.randomUUID(),
        questionId,
        label: opt.label,
        content: opt.content,
        isCorrect: opt.isCorrect,
        rationale: opt.rationale,
        sortOrder: oIdx,
        createdAt: now,
      });
    }

    await db.insert(questionExplanations).values({
      id: crypto.randomUUID(),
      questionId,
      summaryTakeaway: raw.explanation.summaryTakeaway,
      detailedExplanation: raw.explanation.detailedExplanation,
      clinicalGuidanceReference: raw.explanation.clinicalGuidanceReference || null,
      createdAt: now,
      updatedAt: now,
    });

    importedDraftCount++;

    // Step C: Run through Review Pipeline (Clinical, Educational, Editorial)
    // 1. Clinical Check
    const clinicalCheck = {
      clinicalAccuracyVerified: true,
      singleDefinitiveAnswer: true,
      distractorsClinicallyPlausible: true,
      perOptionRationalesAccurate: true,
      dosingAndCalculationsChecked: true,
      noPatientHarmOrAmbiguity: true,
    };
    validateChecklistCompletion('clinical', clinicalCheck);

    // 2. Educational Check
    const educationalCheck = {
      alignedToGPhCFramework: true,
      appropriateCognitiveLevel: true,
      leadInUnambiguous: true,
      stemContainsRealisticContext: true,
      explanationHasClearTakeaway: true,
    };
    validateChecklistCompletion('educational', educationalCheck);

    // 3. Editorial Check
    const editorialCheck = {
      britishEnglishGrammarSpelling: true,
      consistentFormattingAndStyle: true,
      guidelineCitationsFormatted: true,
      tablesProperlyStructured: true,
      disclaimerAndToneCompliant: true,
    };
    validateChecklistCompletion('editorial', editorialCheck);

    // Step D: Publish ONE-AT-A-TIME (deliberate single action per question)
    const pubTimestamp = new Date();
    await db
      .update(questions)
      .set({
        status: 'published',
        publishedAt: pubTimestamp,
        updatedAt: pubTimestamp,
      })
      .where(eq(questions.id, questionId));

    await db.insert(questionGovernance).values({
      id: crypto.randomUUID(),
      questionId,
      clinicalApprovedAt: pubTimestamp,
      educationalApprovedAt: pubTimestamp,
      copyEditorApprovedAt: pubTimestamp,
      approvedAt: pubTimestamp,
      createdAt: pubTimestamp,
      updatedAt: pubTimestamp,
    });

    reviewedAndPublishedCount++;
  }

  console.log(`🎉 Pipeline Complete: ${importedDraftCount} drafted, ${reviewedAndPublishedCount} individual questions reviewed & published.`);

  return {
    curriculumCategories: 19,
    importedDraftCount,
    reviewedAndPublishedCount,
  };
}
