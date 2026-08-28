import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, asc, inArray, and } from 'drizzle-orm';
import { 
  questions, 
  questionContent, 
  questionOptions, 
  questionExplanations, 
  questionSecondarySubtopics,
  pathways,
  subtopics
} from '../db/schema';
import { requireAuth, type AuthContext } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateQuestion, type QuestionValidationPayload } from '../lib/question-validator';
import { chunkQuestionOnPublish } from '../lib/chunking-pipeline';

const questionsRouter = new Hono<AuthContext>();

// Restrict question authoring and editing to authors, reviewers, content leads, or super admins
const requireContentEditor = requireRole(['author', 'clinical_reviewer', 'educational_reviewer', 'content_lead', 'super_admin']);

// ==========================================
// 1. List Questions (Paginated & Filterable)
// ==========================================

questionsRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const status = c.req.query('status');
  const subtopicId = c.req.query('subtopic_id');
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);

  let query = db.select().from(questions);

  // Filters
  if (status) {
    query = query.where(eq(questions.status, status as any)) as any;
  }
  if (subtopicId) {
    query = query.where(eq(questions.primarySubtopicId, subtopicId)) as any;
  }

  const items = await query.orderBy(desc(questions.createdAt)).limit(limit);
  return c.json({ questions: items });
});

// ==========================================
// 2. Get Single Question with Full Relations
// ==========================================

questionsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing question id' }, 400);

  const db = drizzle(c.env.DB);

  const [question] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }

  const [content] = await db.select().from(questionContent).where(eq(questionContent.questionId, id)).limit(1);
  const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.sortOrder));
  const [explanation] = await db.select().from(questionExplanations).where(eq(questionExplanations.questionId, id)).limit(1);
  const secondary = await db.select().from(questionSecondarySubtopics).where(eq(questionSecondarySubtopics.questionId, id));

  return c.json({
    question: {
      ...question,
      content,
      options,
      explanation,
      secondarySubtopicIds: secondary.map((s) => s.subtopicId),
    },
  });
});

// ==========================================
// 3. Create Question (Server-side Section 7.3 Validation Checklist)
// ==========================================

questionsRouter.post('/', requireContentEditor, async (c) => {
  const body = await c.req.json<QuestionValidationPayload>();

  // 1. Enforce Server-Side Checklist Validation
  const isPublishing = body.status === 'published';
  const validation = validateQuestion(body, isPublishing);

  if (!validation.valid) {
    return c.json({
      error: 'Question Validation Failed: Checklist criteria not met.',
      details: validation.errors,
    }, 422);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const questionId = crypto.randomUUID();
  const publicId = body.publicId || `ACP-${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Insert Base Question Row
  await db.insert(questions).values({
    id: questionId,
    publicId,
    version: 1,
    status: body.status || 'draft',
    pathwayId: body.pathwayId,
    primarySubtopicId: body.primarySubtopicId,
    difficulty: body.difficulty || 'medium',
    questionType: body.questionType || 'sba',
    sector: body.sector || 'any',
    learningObjective: body.learningObjective || null,
    origin: 'human',
    publishedAt: isPublishing ? now : null,
    createdAt: now,
    updatedAt: now,
  });

  // 3. Insert Question Content
  await db.insert(questionContent).values({
    id: crypto.randomUUID(),
    questionId,
    stem: body.stem.trim(),
    leadIn: body.leadIn.trim(),
    numericAnswer: body.calculation?.numericAnswer || null,
    numericTolerance: body.calculation?.numericTolerance || null,
    numericUnit: body.calculation?.numericUnit || null,
    decimalPlaces: body.calculation?.decimalPlaces ?? null,
    calculatorAllowed: body.calculation?.calculatorAllowed ?? true,
    calculationWorking: body.calculation?.calculationWorking || null,
    createdAt: now,
    updatedAt: now,
  });

  // 4. Insert Question Options with Mandatory Rationales
  for (let i = 0; i < body.options.length; i++) {
    const opt = body.options[i];
    await db.insert(questionOptions).values({
      id: crypto.randomUUID(),
      questionId,
      label: opt.label || String.fromCharCode(65 + i), // 'A', 'B', 'C', 'D', 'E'
      content: opt.content.trim(),
      isCorrect: Boolean(opt.isCorrect),
      rationale: opt.rationale.trim(),
      sortOrder: i,
      createdAt: now,
    });
  }

  // 5. Insert Explanations
  await db.insert(questionExplanations).values({
    id: crypto.randomUUID(),
    questionId,
    summaryTakeaway: body.explanation.summaryTakeaway.trim(),
    detailedExplanation: body.explanation.detailedExplanation.trim(),
    clinicalGuidanceReference: body.explanation.clinicalGuidanceReference || null,
    createdAt: now,
    updatedAt: now,
  });

  // 6. Insert Secondary Subtopics (if any)
  if (Array.isArray(body.secondarySubtopicIds) && body.secondarySubtopicIds.length > 0) {
    for (const subId of body.secondarySubtopicIds) {
      if (subId && subId !== body.primarySubtopicId) {
        await db.insert(questionSecondarySubtopics).values({
          id: crypto.randomUUID(),
          questionId,
          subtopicId: subId,
          createdAt: now,
        });
      }
    }
  }

  return c.json({
    status: 'created',
    questionId,
    publicId,
  }, 201);
});

// ==========================================
// 4. Update Question (Server-side Section 7.3 Validation Checklist)
// ==========================================

questionsRouter.put('/:id', requireContentEditor, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing question id' }, 400);

  const body = await c.req.json<QuestionValidationPayload>();
  const isPublishing = body.status === 'published';
  const validation = validateQuestion(body, isPublishing);

  if (!validation.valid) {
    return c.json({
      error: 'Question Validation Failed: Checklist criteria not met.',
      details: validation.errors,
    }, 422);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();

  // 1. Fetch current question to increment version
  const [existing] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!existing) {
    return c.json({ error: 'Question not found' }, 404);
  }

  // 2. Update Question Row
  await db
    .update(questions)
    .set({
      status: body.status,
      pathwayId: body.pathwayId,
      primarySubtopicId: body.primarySubtopicId,
      difficulty: body.difficulty,
      questionType: body.questionType,
      sector: body.sector,
      learningObjective: body.learningObjective || null,
      version: existing.version + 1,
      publishedAt: isPublishing && !existing.publishedAt ? now : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(questions.id, id));

  // 3. Update Content
  await db
    .update(questionContent)
    .set({
      stem: body.stem.trim(),
      leadIn: body.leadIn.trim(),
      numericAnswer: body.calculation?.numericAnswer || null,
      numericTolerance: body.calculation?.numericTolerance || null,
      numericUnit: body.calculation?.numericUnit || null,
      decimalPlaces: body.calculation?.decimalPlaces ?? null,
      calculatorAllowed: body.calculation?.calculatorAllowed ?? true,
      calculationWorking: body.calculation?.calculationWorking || null,
      updatedAt: now,
    })
    .where(eq(questionContent.questionId, id));

  // 4. Update Options: Clean up existing and re-insert
  await db.delete(questionOptions).where(eq(questionOptions.questionId, id));
  for (let i = 0; i < body.options.length; i++) {
    const opt = body.options[i];
    await db.insert(questionOptions).values({
      id: crypto.randomUUID(),
      questionId: id,
      label: opt.label || String.fromCharCode(65 + i),
      content: opt.content.trim(),
      isCorrect: Boolean(opt.isCorrect),
      rationale: opt.rationale.trim(),
      sortOrder: i,
      createdAt: now,
    });
  }

  // 5. Update Explanations
  await db
    .update(questionExplanations)
    .set({
      summaryTakeaway: body.explanation.summaryTakeaway.trim(),
      detailedExplanation: body.explanation.detailedExplanation.trim(),
      clinicalGuidanceReference: body.explanation.clinicalGuidanceReference || null,
      updatedAt: now,
    })
    .where(eq(questionExplanations.questionId, id));

  return c.json({
    status: 'updated',
    questionId: id,
    version: existing.version + 1,
  });
});

import { 
  VALID_STATUS_TRANSITIONS, 
  validateChecklistCompletion,
  type QuestionStatus,
  type ReviewSubmissionPayload 
} from '../lib/review-state-machine';
import { questionGovernance } from '../db/schema';

// ==========================================
// 5. Review Submission & State Transitions (Section 7.4)
// ==========================================

questionsRouter.post('/:id/review', requireContentEditor, async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Missing question id' }, 400);

  const body = await c.req.json<ReviewSubmissionPayload>();
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const now = new Date();

  const [existing] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!existing) {
    return c.json({ error: 'Question not found' }, 404);
  }

  const currentStatus = existing.status as QuestionStatus;
  const targetStatus = body.targetStatus;

  // 1. Validate State Transition Legality
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(targetStatus)) {
    return c.json({
      error: `Illegal state transition from "${currentStatus}" to "${targetStatus}". Allowed: ${allowedTransitions.join(', ')}`,
    }, 400);
  }

  // 2. Validate Checklist Completion if advancing status
  if (targetStatus !== 'changes_requested' && targetStatus !== 'draft' && targetStatus !== 'archived') {
    const checklistVal = validateChecklistCompletion(body.reviewType, body.checklist as any);
    if (!checklistVal.complete) {
      return c.json({
        error: `Section 7.4 Review Checklist Incomplete: ${body.reviewType} checklist must be 100% satisfied.`,
        missingChecklistItems: checklistVal.missingItems,
      }, 422);
    }
  }

  // 3. Update Question Status
  await db
    .update(questions)
    .set({
      status: targetStatus,
      publishedAt: targetStatus === 'published' && !existing.publishedAt ? now : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(questions.id, id));

  // Chunking Pipeline on Publish (Section 5.1 & Milestone 5)
  let chunksGenerated = 0;
  if (targetStatus === 'published') {
    chunksGenerated = await chunkQuestionOnPublish(db, id, c.env.AI, c.env.VECTORIZE);
  }

  // 4. Update / Upsert Governance Record
  const [gov] = await db.select().from(questionGovernance).where(eq(questionGovernance.questionId, id)).limit(1);
  
  const govUpdate: any = {
    updatedAt: now,
  };

  if (body.reviewType === 'clinical') {
    govUpdate.clinicalReviewerId = user.id;
    govUpdate.clinicalApprovedAt = targetStatus !== 'changes_requested' ? now : null;
  } else if (body.reviewType === 'educational') {
    govUpdate.educationalReviewerId = user.id;
    govUpdate.educationalApprovedAt = targetStatus !== 'changes_requested' ? now : null;
  } else if (body.reviewType === 'editorial') {
    govUpdate.copyEditorId = user.id;
    govUpdate.copyEditorApprovedAt = targetStatus !== 'changes_requested' ? now : null;
  }

  if (targetStatus === 'approved') {
    govUpdate.approvedAt = now;
  }

  if (body.conflictOfInterest !== undefined) {
    govUpdate.conflictOfInterest = body.conflictOfInterest;
    govUpdate.conflictDetails = body.conflictDetails || null;
  }

  if (gov) {
    await db.update(questionGovernance).set(govUpdate).where(eq(questionGovernance.id, gov.id));
  } else {
    await db.insert(questionGovernance).values({
      id: crypto.randomUUID(),
      questionId: id,
      authorId: user.id,
      ...govUpdate,
      createdAt: now,
    });
  }

  return c.json({
    status: 'success',
    previousStatus: currentStatus,
    newStatus: targetStatus,
    reviewedBy: user.email,
  });
});

import { validateSpreadsheetBatch, type RawSpreadsheetRow } from '../lib/spreadsheet-importer';

// ==========================================
// 6. Spreadsheet Importer Pipeline (Section 7.3 & Rule #5)
// ==========================================

questionsRouter.post('/import/validate', requireContentEditor, async (c) => {
  const body = await c.req.json<{
    pathwayId: string;
    rows: RawSpreadsheetRow[];
  }>();

  if (!body.pathwayId || !Array.isArray(body.rows)) {
    return c.json({ error: 'Validation: pathwayId and rows array are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const allSubtopics = await db.select().from(subtopics);
  const subtopicMap: Record<string, string> = {};
  for (const s of allSubtopics) {
    subtopicMap[s.code.toLowerCase()] = s.id;
  }

  const report = validateSpreadsheetBatch(body.rows, body.pathwayId, subtopicMap);
  return c.json({ report });
});

questionsRouter.post('/import/commit', requireContentEditor, async (c) => {
  const body = await c.req.json<{
    pathwayId: string;
    rows: RawSpreadsheetRow[];
  }>();

  if (!body.pathwayId || !Array.isArray(body.rows)) {
    return c.json({ error: 'Validation: pathwayId and rows array are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const allSubtopics = await db.select().from(subtopics);
  const subtopicMap: Record<string, string> = {};
  for (const s of allSubtopics) {
    subtopicMap[s.code.toLowerCase()] = s.id;
  }

  const validation = validateSpreadsheetBatch(body.rows, body.pathwayId, subtopicMap);
  const validRows = validation.rowReports.filter((r) => r.status === 'valid' && r.parsedPayload);

  if (validRows.length === 0) {
    return c.json({
      error: 'No valid rows to commit. Please resolve errors shown in the validation report.',
      report: validation,
    }, 422);
  }

  const now = new Date();
  const committedIds: string[] = [];

  // Commit valid rows strictly as 'draft' (Non-Negotiable Rule #5)
  for (const row of validRows) {
    const payload = row.parsedPayload!;
    const questionId = crypto.randomUUID();

    // Base Question
    await db.insert(questions).values({
      id: questionId,
      publicId: payload.publicId || `ACP-IMP-${row.rowNumber}`,
      version: 1,
      status: 'draft', // Strictly draft
      pathwayId: payload.pathwayId,
      primarySubtopicId: payload.primarySubtopicId,
      difficulty: payload.difficulty,
      questionType: payload.questionType,
      sector: payload.sector,
      origin: 'human',
      createdAt: now,
      updatedAt: now,
    });

    // Content
    await db.insert(questionContent).values({
      id: crypto.randomUUID(),
      questionId,
      stem: payload.stem,
      leadIn: payload.leadIn,
      numericAnswer: payload.calculation?.numericAnswer || null,
      numericTolerance: payload.calculation?.numericTolerance || null,
      calculationWorking: payload.calculation?.calculationWorking || null,
      createdAt: now,
      updatedAt: now,
    });

    // Options
    for (let i = 0; i < payload.options.length; i++) {
      const opt = payload.options[i];
      await db.insert(questionOptions).values({
        id: crypto.randomUUID(),
        questionId,
        label: opt.label,
        content: opt.content,
        isCorrect: opt.isCorrect,
        rationale: opt.rationale,
        sortOrder: i,
        createdAt: now,
      });
    }

    // Explanation
    await db.insert(questionExplanations).values({
      id: crypto.randomUUID(),
      questionId,
      summaryTakeaway: payload.explanation.summaryTakeaway,
      detailedExplanation: payload.explanation.detailedExplanation,
      clinicalGuidanceReference: payload.explanation.clinicalGuidanceReference || null,
      createdAt: now,
      updatedAt: now,
    });

    committedIds.push(questionId);
  }

  return c.json({
    status: 'committed',
    totalProcessed: body.rows.length,
    committedDraftsCount: committedIds.length,
    skippedInvalidCount: validation.invalidCount,
    committedIds,
  }, 201);
});

// ==========================================
// Bookmarks, Notes & Report System
// ==========================================

import { bookmarks, notes, questionReports } from '../db/schema';

// 1. Toggle Bookmark
questionsRouter.post('/:id/bookmark', requireAuth, async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('id');
  if (!questionId) return c.json({ error: 'Question ID is required' }, 400);

  const db = drizzle(c.env.DB);
  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, user.id), eq(bookmarks.questionId, questionId)))
    .limit(1);

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    return c.json({ bookmarked: false });
  } else {
    await db.insert(bookmarks).values({
      id: crypto.randomUUID(),
      userId: user.id,
      questionId,
      createdAt: new Date(),
    });
    return c.json({ bookmarked: true }, 201);
  }
});

// 2. Personal Notes for Question
questionsRouter.get('/:id/notes', requireAuth, async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('id');
  if (!questionId) return c.json({ error: 'Question ID is required' }, 400);

  const db = drizzle(c.env.DB);
  const userNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, user.id), eq(notes.questionId, questionId)))
    .orderBy(desc(notes.updatedAt));

  return c.json({ notes: userNotes });
});

questionsRouter.post('/:id/notes', requireAuth, async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('id');
  if (!questionId) return c.json({ error: 'Question ID is required' }, 400);

  const body = await c.req.json<{ title?: string; content: string; subtopicId?: string }>();
  if (!body.content?.trim()) {
    return c.json({ error: 'Note content cannot be empty' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const noteId = crypto.randomUUID();

  await db.insert(notes).values({
    id: noteId,
    userId: user.id,
    questionId,
    subtopicId: body.subtopicId || null,
    title: body.title?.trim() || null,
    content: body.content.trim(),
    createdAt: now,
    updatedAt: now,
  });

  return c.json({
    id: noteId,
    message: 'Personal clinical note saved',
  }, 201);
});

// 3. Report-a-Question with Auto-Attached Metadata
export interface QuestionReportPayload {
  issueType: 'clinical_inaccuracy' | 'typo' | 'explanation_unclear' | 'broken_reference' | 'other';
  message: string;
  questionVersion: number;
  sessionId?: string;
}

questionsRouter.post('/:id/report', requireAuth, async (c) => {
  const user = c.get('user');
  const questionId = c.req.param('id');
  if (!questionId) return c.json({ error: 'Question ID is required' }, 400);

  const body = await c.req.json<QuestionReportPayload>();
  if (!body.message?.trim()) {
    return c.json({ error: 'Please provide details about the issue.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();
  const reportId = crypto.randomUUID();

  // Auto-attach user metadata, question version, session context, and client timestamp
  await db.insert(questionReports).values({
    id: reportId,
    userId: user.id,
    questionId,
    questionVersion: body.questionVersion || 1,
    sessionId: body.sessionId || null,
    issueType: body.issueType || 'clinical_inaccuracy',
    message: body.message.trim(),
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });

  return c.json({
    reportId,
    status: 'received',
    message: 'Thank you for reporting. Our clinical content team will review this promptly.',
  }, 201);
});

export { questionsRouter };
