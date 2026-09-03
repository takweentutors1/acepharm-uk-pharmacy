import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ==========================================
// 1. Identity & Profiles
// ==========================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // crypto.randomUUID()
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull().unique(), // lower-cased
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  firstName: text('first_name'),
  role: text('role', {
    enum: [
      'student',
      'author',
      'clinical_reviewer',
      'educational_reviewer',
      'copy_editor',
      'content_lead',
      'support_agent',
      'finance_admin',
      'marketing_editor',
      'super_admin',
    ],
  }).notNull().default('student'),
  status: text('status', {
    enum: ['active', 'suspended', 'pending_deletion', 'deleted'],
  }).notNull().default('active'),
  deletionRequestedAt: integer('deletion_requested_at', { mode: 'timestamp' }),
  timezone: text('timezone').notNull().default('Europe/London'),
  marketingOptIn: integer('marketing_opt_in', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const universities = sqliteTable('universities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  emailDomain: text('email_domain'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  stage: text('stage', {
    enum: ['year_2', 'year_3', 'year_4', 'foundation_trainee', 'oriel', 'ip', 'other'],
  }),
  primaryGoal: text('primary_goal'),
  assessmentDate: text('assessment_date'),
  dailyQuestionTarget: integer('daily_question_target').notNull().default(20),
  universityId: text('university_id').references(() => universities.id),
  showConfidencePrompt: integer('show_confidence_prompt', { mode: 'boolean' }).notNull().default(true),
  hideOptionsByDefault: integer('hide_options_by_default', { mode: 'boolean' }).notNull().default(false),
  showDifficultyLabels: integer('show_difficulty_labels', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==========================================
// 2. Curriculum & Content
// ==========================================

export const pathways = sqliteTable('pathways', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  pathwayId: text('pathway_id').notNull().references(() => pathways.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  pathwayIdx: index('categories_pathway_idx').on(table.pathwayId),
}));

export const subtopics = sqliteTable('subtopics', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  categoryIdx: index('subtopics_category_idx').on(table.categoryId),
}));

export const subtopicNotes = sqliteTable('subtopic_notes', {
  id: text('id').primaryKey(),
  subtopicId: text('subtopic_id').notNull().unique().references(() => subtopics.id, { onDelete: 'cascade' }),
  contentMarkdown: text('content_markdown').notNull(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  version: integer('version').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const contentChunks = sqliteTable('content_chunks', {
  id: text('id').primaryKey(),
  sourceType: text('source_type', {
    enum: ['subtopic_note', 'explanation', 'reference'],
  }).notNull(),
  sourceId: text('source_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  contentText: text('content_text').notNull(),
  tokenCount: integer('token_count').notNull(),
  vectorizeId: text('vectorize_id').notNull().unique(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  sourceIdx: index('content_chunks_source_idx').on(table.sourceType, table.sourceId),
}));

// ==========================================
// 3. Question Bank & Validation
// ==========================================

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  version: integer('version').notNull().default(1),
  status: text('status', {
    enum: [
      'idea',
      'draft',
      'awaiting_clinical_review',
      'changes_requested',
      'awaiting_editorial_review',
      'approved',
      'scheduled',
      'published',
      'update_required',
      'suspended',
      'archived',
    ],
  }).notNull().default('draft'),
  pathwayId: text('pathway_id').notNull().references(() => pathways.id),
  primarySubtopicId: text('primary_subtopic_id').notNull().references(() => subtopics.id),
  difficulty: text('difficulty', {
    enum: ['easy', 'medium', 'hard'],
  }).notNull().default('medium'),
  questionType: text('question_type', {
    enum: ['sba', 'emq', 'calculation'],
  }).notNull().default('sba'),
  sector: text('sector', {
    enum: ['community', 'hospital', 'gp', 'any'],
  }).notNull().default('any'),
  learningObjective: text('learning_objective'),
  origin: text('origin', {
    enum: ['human', 'ai_drafted'],
  }).notNull().default('human'),
  generatedByThreadId: text('generated_by_thread_id'),
  generationPrompt: text('generation_prompt'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  nextReviewAt: integer('next_review_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  subtopicIdx: index('questions_subtopic_idx').on(table.primarySubtopicId),
  statusIdx: index('questions_status_idx').on(table.status),
  statusSubtopicIdx: index('questions_status_subtopic_idx').on(table.status, table.primarySubtopicId),
  statusPathwayIdx: index('questions_status_pathway_idx').on(table.status, table.pathwayId),
}));

export const questionSecondarySubtopics = sqliteTable('question_secondary_subtopics', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  subtopicId: text('subtopic_id').notNull().references(() => subtopics.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  secondaryUniqueIdx: uniqueIndex('question_secondary_unique_idx').on(table.questionId, table.subtopicId),
  secondarySubtopicIdx: index('question_secondary_subtopic_idx').on(table.subtopicId),
}));

export const questionContent = sqliteTable('question_content', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().unique().references(() => questions.id, { onDelete: 'cascade' }),
  stem: text('stem').notNull(),
  leadIn: text('lead_in').notNull(),
  numericAnswer: text('numeric_answer'),
  numericTolerance: text('numeric_tolerance'),
  numericUnit: text('numeric_unit'),
  decimalPlaces: integer('decimal_places'),
  calculatorAllowed: integer('calculator_allowed', { mode: 'boolean' }).default(true),
  calculationWorking: text('calculation_working'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const questionOptions = sqliteTable('question_options', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  content: text('content').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  rationale: text('rationale').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  questionIdx: index('question_options_question_idx').on(table.questionId),
}));

export const questionExplanations = sqliteTable('question_explanations', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().unique().references(() => questions.id, { onDelete: 'cascade' }),
  summaryTakeaway: text('summary_takeaway').notNull(),
  detailedExplanation: text('detailed_explanation').notNull(),
  clinicalGuidanceReference: text('clinical_guidance_reference'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const references = sqliteTable('references', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceName: text('source_name').notNull(),
  url: text('url'),
  linkStatus: text('link_status', {
    enum: ['ok', 'broken', 'superseded'],
  }).notNull().default('ok'),
  lastCheckedAt: integer('last_checked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const questionReferences = sqliteTable('question_references', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  referenceId: text('reference_id').notNull().references(() => references.id, { onDelete: 'cascade' }),
  specificSection: text('specific_section'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  questionRefUniqueIdx: uniqueIndex('question_ref_unique_idx').on(table.questionId, table.referenceId),
}));

export const questionVersions = sqliteTable('question_versions', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  snapshotJson: text('snapshot_json').notNull(),
  changeSummary: text('change_summary').notNull(),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  questionVersionIdx: index('question_versions_idx').on(table.questionId, table.version),
}));

export const questionGovernance = sqliteTable('question_governance', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().unique().references(() => questions.id, { onDelete: 'cascade' }),
  authorId: text('author_id').references(() => users.id),
  clinicalReviewerId: text('clinical_reviewer_id').references(() => users.id),
  clinicalApprovedAt: integer('clinical_approved_at', { mode: 'timestamp' }),
  educationalReviewerId: text('educational_reviewer_id').references(() => users.id),
  educationalApprovedAt: integer('educational_approved_at', { mode: 'timestamp' }),
  copyEditorId: text('copy_editor_id').references(() => users.id),
  copyEditorApprovedAt: integer('copy_editor_approved_at', { mode: 'timestamp' }),
  conflictOfInterest: integer('conflict_of_interest', { mode: 'boolean' }).notNull().default(false),
  conflictDetails: text('conflict_details'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==========================================
// 4. Learner Activity — Dual-Store Isolation
// ==========================================

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mode: text('mode', {
    enum: ['learn', 'timed'],
  }).notNull().default('learn'),
  totalQuestions: integer('total_questions').notNull(),
  questionsAnswered: integer('questions_answered').notNull().default(0),
  correctAnswers: integer('correct_answers').notNull().default(0),
  timeLimitSeconds: integer('time_limit_seconds'),
  timeTakenSeconds: integer('time_taken_seconds').notNull().default(0),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  configurationJson: text('configuration_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
}));

// Permanent, immutable store — NEVER deleted on category reset
export const questionFirstAttempts = sqliteTable('question_first_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  questionVersion: integer('question_version').notNull().default(1),
  selectedOptionId: text('selected_option_id').references(() => questionOptions.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  confidence: text('confidence', {
    enum: ['low', 'medium', 'high'],
  }),
  timeTakenSeconds: integer('time_taken_seconds').notNull().default(0),
  mode: text('mode', {
    enum: ['learn', 'timed'],
  }).notNull().default('learn'),
  answeredAt: integer('answered_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  firstAttemptUniqueIdx: uniqueIndex('first_attempt_user_question_unique_idx').on(table.userId, table.questionId),
  firstAttemptCorrectIdx: index('first_attempts_user_correct_idx').on(table.userId, table.isCorrect),
}));

// Working, user-clearable practice store — Cleared on category reset
export const questionAttempts = sqliteTable('question_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  attemptNumber: integer('attempt_number').notNull().default(1),
  questionVersion: integer('question_version').notNull().default(1),
  selectedOptionId: text('selected_option_id').references(() => questionOptions.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  confidence: text('confidence', {
    enum: ['low', 'medium', 'high'],
  }),
  timeTakenSeconds: integer('time_taken_seconds').notNull().default(0),
  mode: text('mode', {
    enum: ['learn', 'timed'],
  }).notNull().default('learn'),
  explanationOpened: integer('explanation_opened', { mode: 'boolean' }).notNull().default(false),
  dueForReviewAt: integer('due_for_review_at', { mode: 'timestamp' }),
  answeredAt: integer('answered_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userQuestionIdx: index('attempts_user_question_idx').on(table.userId, table.questionId),
  userCorrectIdx: index('attempts_user_correct_idx').on(table.userId, table.isCorrect),
  sessionIdx: index('attempts_session_idx').on(table.sessionId),
  dueReviewIdx: index('attempts_due_review_idx').on(table.userId, table.dueForReviewAt),
}));

export const bookmarks = sqliteTable('bookmarks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  bookmarksUniqueIdx: uniqueIndex('bookmarks_user_question_unique_idx').on(table.userId, table.questionId),
}));

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').references(() => questions.id, { onDelete: 'set null' }),
  subtopicId: text('subtopic_id').references(() => subtopics.id, { onDelete: 'set null' }),
  title: text('title'),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('notes_user_idx').on(table.userId),
}));

export const questionReports = sqliteTable('question_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  questionVersion: integer('question_version').notNull().default(1),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  issueType: text('issue_type', {
    enum: ['clinical_inaccuracy', 'typo', 'explanation_unclear', 'broken_reference', 'other'],
  }).notNull(),
  message: text('message').notNull(),
  status: text('status', {
    enum: ['open', 'in_review', 'resolved', 'dismissed'],
  }).notNull().default('open'),
  resolutionNotes: text('resolution_notes'),
  resolvedByUserId: text('resolved_by_user_id').references(() => users.id),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  statusIdx: index('reports_status_idx').on(table.status),
}));

// ==========================================
// 5. The Ace AI Layer
// ==========================================

export const aceThreads = sqliteTable('ace_threads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contextType: text('context_type', {
    enum: ['question', 'dashboard', 'planner', 'calculation', 'simulator'],
  }).notNull(),
  contextId: text('context_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userContextIdx: index('ace_threads_user_context_idx').on(table.userId, table.contextType, table.contextId),
}));

export const aceMessages = sqliteTable('ace_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => aceThreads.id, { onDelete: 'cascade' }),
  role: text('role', {
    enum: ['user', 'assistant', 'system'],
  }).notNull(),
  content: text('content').notNull(),
  intent: text('intent'),
  retrievedChunkIds: text('retrieved_chunk_ids'),
  citations: text('citations'),
  model: text('model').notNull().default('mimo-v2.5-free'),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  costPence: integer('cost_pence').notNull().default(0),
  flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
  flagReason: text('flag_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  threadIdx: index('ace_messages_thread_idx').on(table.threadId),
}));

export const aceUsage = sqliteTable('ace_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  messageCount: integer('message_count').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userDateUniqueIdx: uniqueIndex('ace_usage_user_date_unique_idx').on(table.userId, table.date),
}));

// Spaced Repetition (SM-2 Algorithm)
export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  questionId: text('question_id').references(() => questions.id, { onDelete: 'cascade' }),
  subtopicId: text('subtopic_id').references(() => subtopics.id, { onDelete: 'set null' }),
  frontPrompt: text('front_prompt').notNull(),
  backAnswer: text('back_answer').notNull(),
  intervalDays: integer('interval_days').notNull().default(1),
  ease: integer('ease').notNull().default(250),
  dueAt: integer('due_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  reviews: integer('reviews').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userDueIdx: index('flashcards_user_due_idx').on(table.userId, table.dueAt),
}));

export const revisionPlans = sqliteTable('revision_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  targetAssessmentDate: text('target_assessment_date'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const revisionPlanDays = sqliteTable('revision_plan_days', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull().references(() => revisionPlans.id, { onDelete: 'cascade' }),
  dayIndex: integer('day_index').notNull(),
  planDate: text('plan_date').notNull(),
  dayType: text('day_type', {
    enum: ['study', 'spaced_review', 'weak_topic_focus', 'rest'],
  }).notNull(),
  targetSubtopicIds: text('target_subtopic_ids'),
  targetQuestionCount: integer('target_question_count').notNull().default(20),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  planDayIdx: index('revision_plan_days_idx').on(table.planId, table.dayIndex),
}));

export const simulatorScenarios = sqliteTable('simulator_scenarios', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  personaName: text('persona_name').notNull(),
  personaRole: text('persona_role').notNull(),
  scenarioContext: text('scenario_context').notNull(),
  rubricJson: text('rubric_json').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const simulatorAttempts = sqliteTable('simulator_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scenarioId: text('scenario_id').notNull().references(() => simulatorScenarios.id, { onDelete: 'cascade' }),
  transcriptJson: text('transcript_json').notNull(),
  score: integer('score').notNull(),
  feedbackJson: text('feedback_json').notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('simulator_attempts_user_idx').on(table.userId),
}));

// ==========================================
// 6. Subscriptions, Access & Audit
// ==========================================

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  plan: text('plan', {
    enum: ['explorer', 'monthly_pro', 'yearly_pro'],
  }).notNull().default('explorer'),
  status: text('status', {
    enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'],
  }).notNull().default('active'),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
  canceledAt: integer('canceled_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('subscriptions_user_idx').on(table.userId),
  stripeCustomerIdx: index('subscriptions_stripe_customer_idx').on(table.stripeCustomerId),
}));

export const freeTierUsage = sqliteTable('free_tier_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  questionsAnswered: integer('questions_answered').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userPeriodIdx: index('free_tier_user_period_idx').on(table.userId, table.periodStart),
}));

export const accessGrants = sqliteTable('access_grants', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  grantedByUserId: text('granted_by_user_id').notNull().references(() => users.id),
  plan: text('plan', {
    enum: ['monthly_pro', 'yearly_pro'],
  }).notNull(),
  reason: text('reason').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('access_grants_user_idx').on(table.userId),
}));

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  metadataJson: text('metadata_json'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userActionIdx: index('audit_log_user_action_idx').on(table.userId, table.action),
  entityIdx: index('audit_log_entity_idx').on(table.entityType, table.entityId),
}));

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['system', 'revision_reminder', 'subscription', 'moderation', 'achievement_note'],
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userUnreadIdx: index('notifications_user_unread_idx').on(table.userId, table.read),
}));

export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  coverImageUrl: text('cover_image_url'),
  authorId: text('author_id').references(() => users.id),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  readingTimeMinutes: integer('reading_time_minutes').notNull().default(3),
  canonicalUrl: text('canonical_url'),
  tagsJson: text('tags_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  publishedIdx: index('blog_posts_published_idx').on(table.published, table.publishedAt),
}));

export const supportTickets = sqliteTable('support_tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  category: text('category', {
    enum: ['billing', 'technical', 'clinical_content', 'account', 'general'],
  }).notNull().default('general'),
  status: text('status', {
    enum: ['open', 'in_progress', 'resolved', 'closed'],
  }).notNull().default('open'),
  assignedToUserId: text('assigned_to_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  statusIdx: index('support_tickets_status_idx').on(table.status),
}));

export const featureFlags = sqliteTable('feature_flags', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  description: text('description'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').notNull().default(100),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
