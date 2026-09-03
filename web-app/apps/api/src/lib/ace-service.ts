import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray } from 'drizzle-orm';
import { generateText, streamText } from 'ai';
import { contentChunks, aceMessages, aceUsage, questions, questionExplanations, subtopics, references } from '../db/schema';
import { getMimoModel } from './zen-ai-client';

export type AceContextType = 'question' | 'dashboard' | 'planner' | 'calculation' | 'simulator';

export interface GenerateAceRequest {
  db: ReturnType<typeof drizzle>;
  ai?: any;
  vectorize?: any;
  zenApiKey?: string;
  userId: string;
  threadId: string;
  contextType: AceContextType;
  contextId?: string;
  userPrompt: string;
  intent?: 'simpler' | 'whynot' | 'similar' | 'test' | 'exam' | 'steps' | 'free_text';
  stream?: boolean;
}

export interface RetrievedChunk {
  id: string;
  sourceType: string;
  sourceId: string;
  chunkIndex: number;
  contentText: string;
  score?: number;
}

export interface CitationItem {
  id: string;
  sourceType: string;
  sourceId: string;
  label?: string;
  url?: string;
}

/**
 * Resolves each retrieved chunk's opaque (sourceType, sourceId) pair into
 * a human-readable citation label. Today the chunking pipeline only ever
 * indexes 'subtopic_note' and 'explanation' chunks (never 'reference'),
 * so those two are the only branches that resolve in practice — the
 * 'reference' branch is kept for when/if the BNF/NICE references table
 * is indexed into the RAG pipeline directly.
 */
export async function resolveCitationLabels(
  db: ReturnType<typeof drizzle>,
  chunks: RetrievedChunk[]
): Promise<CitationItem[]> {
  const subtopicIds = [...new Set(chunks.filter((c) => c.sourceType === 'subtopic_note').map((c) => c.sourceId))];
  const questionIds = [...new Set(chunks.filter((c) => c.sourceType === 'explanation').map((c) => c.sourceId))];
  const referenceIds = [...new Set(chunks.filter((c) => c.sourceType === 'reference').map((c) => c.sourceId))];

  const [subtopicRows, questionRows, referenceRows] = await Promise.all([
    subtopicIds.length > 0 ? db.select().from(subtopics).where(inArray(subtopics.id, subtopicIds)) : Promise.resolve([]),
    questionIds.length > 0 ? db.select().from(questions).where(inArray(questions.id, questionIds)) : Promise.resolve([]),
    referenceIds.length > 0 ? db.select().from(references).where(inArray(references.id, referenceIds)) : Promise.resolve([]),
  ]);

  const subtopicMap = new Map(subtopicRows.map((s) => [s.id, s.name]));
  const questionMap = new Map(questionRows.map((q) => [q.id, q.publicId]));
  const referenceMap = new Map(referenceRows.map((r) => [r.id, r]));

  return chunks.map((c) => {
    if (c.sourceType === 'subtopic_note') {
      const subtopicName = subtopicMap.get(c.sourceId);
      return { id: c.id, sourceType: c.sourceType, sourceId: c.sourceId, label: subtopicName ? `${subtopicName} — subtopic notes` : undefined };
    }
    if (c.sourceType === 'explanation') {
      const publicId = questionMap.get(c.sourceId);
      return { id: c.id, sourceType: c.sourceType, sourceId: c.sourceId, label: publicId ? `Question ${publicId} — clinical explanation` : undefined };
    }
    if (c.sourceType === 'reference') {
      const ref = referenceMap.get(c.sourceId);
      return { id: c.id, sourceType: c.sourceType, sourceId: c.sourceId, label: ref ? `${ref.sourceName} — ${ref.title}` : undefined, url: ref?.url ?? undefined };
    }
    return { id: c.id, sourceType: c.sourceType, sourceId: c.sourceId };
  });
}

export interface GenerateAceResponseResult {
  messageId: string;
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costPence: number;
  retrievedChunkIds: string[];
  citations: CitationItem[];
  /** True when this was a deterministic out-of-coverage refusal — no
   * relevant reviewed content was retrieved, so the model was never
   * called at all (see REFUSAL_MESSAGE below). */
  refused: boolean;
  streamResult?: any;
}

/**
 * Fixed refusal copy for queries with zero retrieved grounding. Not
 * LLM-generated: this is a deterministic short-circuit, not a prompted
 * behaviour the model might or might not comply with (Non-Negotiable
 * Rule #2, Section 5.4 — "never an unexplained/ungrounded answer").
 */
const REFUSAL_MESSAGE =
  "I can't find this specific clinical guidance in our reviewed question bank or subtopic notes, so I won't guess. Please refer directly to the current BNF or NICE guidance for this query.";

/**
 * System prompt strictly enforcing clinical grounding, UK English,
 * non-negotiable refusal when out-of-coverage, and safety guidance.
 */
const SYSTEM_PROMPT = `
You are Ace, the AI clinical revision assistant for AcePharm UK Pharmacy students and foundation trainees preparing for the GPhC registration assessment.

### Non-Negotiable Operating Rules (Section 5.4 & Brief Section 6.10):
1. GROUNDED IN REVIEWED CONTENT ONLY: Answer strictly and solely using the provided retrieved clinical context below. Do NOT hallucinate or answer from external unverified training memory.
2. GRACEFUL REFUSAL: If the retrieved clinical context does not contain sufficient information to answer the learner's query fully and safely, you must refuse plainly and courteously (e.g. "I cannot find this specific clinical guidance in our reviewed question bank or subtopic notes. Please refer directly to the current BNF or NICE guidance.").
3. NO PATIENT-SPECIFIC ADVICE: You are an educational revision tool. Never give real-world patient-specific clinical advice or dosing for a live individual. Direct all clinical queries to the BNF or local clinical guidelines.
4. BRITISH ENGLISH & CLINICAL TONE: Write in clear, professional British English (e.g. paracetamol, paediatric, hyperkalaemia, diarrhoea, categorise). Maintain an encouraging, precise clinical tutor register.
5. EXPLICIT CITATIONS: When citing recommendations, reference the underlying subtopic notes, NICE guidelines, or BNF chapters provided in the context.
`.trim();

/**
 * Step 1: Retrieval stage — embed learner prompt, query Vectorize, and hydrate from D1 content_chunks.
 */
export async function retrieveRelevantChunks(
  db: ReturnType<typeof drizzle>,
  userPrompt: string,
  ai?: any,
  vectorize?: any,
  topK: number = 4,
  filterContextId?: string
): Promise<RetrievedChunk[]> {
  if (!ai || !vectorize || !userPrompt.trim()) {
    return [];
  }

  try {
    // 1. Embed query with Workers AI
    const embeddingResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [userPrompt.trim()],
    });

    const queryVector = embeddingResponse?.data?.[0];
    if (!queryVector || !Array.isArray(queryVector)) {
      return [];
    }

    // 2. Query Vectorize with optional namespace/metadata
    const queryOptions: any = {
      topK: Math.max(topK, 6), // Fetch candidate pool for reranking
      returnMetadata: true,
    };

    const matches = await vectorize.query(queryVector, queryOptions);

    if (!matches || !matches.matches || matches.matches.length === 0) {
      return [];
    }

    // 3. Hydrate chunk records from D1 by chunk ID
    const chunkIds = matches.matches.map((m: any) => m.id);
    const rows = await db
      .select()
      .from(contentChunks)
      .where(inArray(contentChunks.id, chunkIds));

    const scoreMap = new Map<string, number>();
    for (const m of matches.matches) {
      scoreMap.set(m.id, m.score || 0);
    }

    // 4. Hybrid Reciprocal Scoring & Context Prioritization
    const hydrated = rows.map((r) => {
      let score = scoreMap.get(r.id) || 0;
      // Contextual boost if chunk source matches the active question ID
      if (filterContextId && r.sourceId === filterContextId) {
        score += 0.25;
      }
      return {
        id: r.id,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        chunkIndex: r.chunkIndex,
        contentText: r.contentText,
        score,
      };
    });

    // Sort by weighted confidence score and truncate to topK
    hydrated.sort((a, b) => (b.score || 0) - (a.score || 0));
    return hydrated.slice(0, topK);
  } catch (err) {
    console.warn('Ace retrieval warning (falling back gracefully):', err);
    return [];
  }
}

/**
 * Single provider-agnostic entry point for Ace AI generation, retrieval and logging.
 * (Section 5.1 & 5.4)
 */
export async function generateAceResponse(params: GenerateAceRequest): Promise<GenerateAceResponseResult> {
  const {
    db,
    ai,
    vectorize,
    zenApiKey,
    userId,
    threadId,
    contextType,
    contextId,
    userPrompt,
    intent = 'free_text',
    stream = false,
  } = params;

  const startTime = Date.now();
  const modelIdentifier = 'mimo-v2.5-free';

  // 1. Log incoming user message in D1 ace_messages
  const userMessageId = `msg-user-${crypto.randomUUID()}`;
  const now = new Date();

  await db.insert(aceMessages).values({
    id: userMessageId,
    threadId,
    role: 'user',
    content: userPrompt.trim(),
    intent,
    model: modelIdentifier,
    createdAt: now,
  });

  // 2. Perform Vectorize RAG Retrieval
  const retrievedChunks = await retrieveRelevantChunks(db, userPrompt, ai, vectorize, 4);
  const retrievedChunkIds = retrievedChunks.map((c) => c.id);

  const citations: CitationItem[] = await resolveCitationLabels(db, retrievedChunks);

  // 2b. Deterministic graceful refusal. If retrieval genuinely found
  // nothing, refuse outright rather than asking the model to decide —
  // relying purely on prompt compliance risks an occasional ungrounded
  // (hallucinated) answer slipping through. Also skips the model call
  // entirely, so it's free.
  if (retrievedChunks.length === 0) {
    const assistantMessageId = `msg-ast-${crypto.randomUUID()}`;
    const latencyMs = Date.now() - startTime;
    const completionTokens = Math.ceil(REFUSAL_MESSAGE.length / 4);

    await db.insert(aceMessages).values({
      id: assistantMessageId,
      threadId,
      role: 'assistant',
      content: REFUSAL_MESSAGE,
      intent,
      retrievedChunkIds: JSON.stringify(retrievedChunkIds),
      citations: JSON.stringify(citations),
      model: modelIdentifier,
      promptTokens: 0,
      completionTokens,
      latencyMs,
      costPence: 0,
      createdAt: new Date(),
    });

    return {
      messageId: assistantMessageId,
      content: REFUSAL_MESSAGE,
      model: modelIdentifier,
      promptTokens: 0,
      completionTokens,
      latencyMs,
      costPence: 0,
      retrievedChunkIds,
      citations,
      refused: true,
    };
  }

  // Format context block
  const contextBlock = retrievedChunks.length > 0
    ? retrievedChunks
        .map(
          (c, i) =>
            `[Retrieved Source ${i + 1} (${c.sourceType} | ID: ${c.sourceId})]:\n${c.contentText}`
        )
        .join('\n\n---\n\n')
    : 'No specific reviewed chunks retrieved for this query. Follow refusal rules if query requires specific unverified clinical guidance.';

  // 3. Assemble complete prompt with intent modifiers
  let intentInstruction = '';
  if (intent === 'simpler') {
    intentInstruction = 'Please break down this clinical explanation in simpler, high-yield terms for a student.';
  } else if (intent === 'whynot') {
    intentInstruction = 'Clarify specifically why the incorrect options are clinical distractors or contraindicated in this scenario.';
  } else if (intent === 'similar') {
    intentInstruction = 'Describe a similar clinical case scenario or condition that tests the same core GPhC learning objective.';
  } else if (intent === 'test') {
    intentInstruction = 'Ask a follow-up multiple choice question to test my understanding of this clinical concept.';
  } else if (intent === 'exam') {
    intentInstruction = 'Highlight common GPhC examination traps, look-alike sound-alike risks, or high-risk monitoring criteria related to this topic.';
  } else if (intent === 'steps') {
    intentInstruction = 'Provide a step-by-step mathematical working breakdown for this calculation.';
  }

  const completeUserPrompt = `
${intentInstruction ? `### Specific Intent: ${intentInstruction}\n\n` : ''}### Learner Question / Inquiry:
${userPrompt.trim()}

### Verified Clinical Grounding Context:
${contextBlock}
  `.trim();

  // 4. Initialize provider-agnostic model (MiMo-V2.5 via Zen Gateway)
  const model = getMimoModel(zenApiKey);
  const assistantMessageId = `msg-ast-${crypto.randomUUID()}`;

  // 5. Handle Streaming vs Synchronous Generation
  if (stream) {
    const streamResult = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: completeUserPrompt,
      onFinish: async (event) => {
        const latencyMs = Date.now() - startTime;
        const promptTokens = (event.usage as any)?.inputTokens ?? (event.usage as any)?.promptTokens ?? Math.ceil(completeUserPrompt.length / 4);
        const completionTokens = (event.usage as any)?.outputTokens ?? (event.usage as any)?.completionTokens ?? Math.ceil((event.text?.length || 0) / 4);

        // Async log completed assistant message into D1
        await db.insert(aceMessages).values({
          id: assistantMessageId,
          threadId,
          role: 'assistant',
          content: event.text || '',
          intent,
          retrievedChunkIds: JSON.stringify(retrievedChunkIds),
          citations: JSON.stringify(citations),
          model: modelIdentifier,
          promptTokens,
          completionTokens,
          latencyMs,
          costPence: 0, // Zen gateway free tier
          createdAt: new Date(),
        });

        // Update ace_usage daily aggregate
        const todayStr = new Date().toISOString().split('T')[0];
        try {
          const [existingUsage] = await db
            .select()
            .from(aceUsage)
            .where(eq(aceUsage.userId, userId))
            .limit(1);

          if (existingUsage) {
            await db
              .update(aceUsage)
              .set({
                messageCount: existingUsage.messageCount + 1,
                totalTokens: existingUsage.totalTokens + promptTokens + completionTokens,
                updatedAt: new Date(),
              })
              .where(eq(aceUsage.id, existingUsage.id));
          } else {
            await db.insert(aceUsage).values({
              id: `usage-${userId}-${todayStr}`,
              userId,
              date: todayStr,
              messageCount: 1,
              totalTokens: promptTokens + completionTokens,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch (e) {
          console.warn('ace_usage update error:', e);
        }
      },
    });

    return {
      messageId: assistantMessageId,
      content: '',
      model: modelIdentifier,
      promptTokens: 0,
      completionTokens: 0,
      latencyMs: 0,
      costPence: 0,
      retrievedChunkIds,
      citations,
      refused: false,
      streamResult,
    };
  } else {
    // Non-streaming synchronous fallback
    let responseText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    // 20-Second Timeout with Retry & Graceful Degradation (Section 5.3)
    const executeWithRetryAndTimeout = async (retries = 1, timeoutMs = 20000): Promise<{ text: string; usage: any }> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const result = await generateText({
            model,
            system: SYSTEM_PROMPT,
            prompt: completeUserPrompt,
            abortSignal: controller.signal,
          });

          clearTimeout(timeoutId);
          return { text: result.text, usage: result.usage };
        } catch (err: any) {
          console.warn(`Zen gateway generation attempt ${attempt + 1} failed:`, err?.message || err);
          if (attempt === retries) throw err;
        }
      }
      throw new Error('All generation attempts failed');
    };

    try {
      const result = await executeWithRetryAndTimeout(1, 20000);
      responseText = result.text;
      promptTokens = (result.usage as any)?.inputTokens ?? (result.usage as any)?.promptTokens ?? Math.ceil(completeUserPrompt.length / 4);
      completionTokens = (result.usage as any)?.outputTokens ?? (result.usage as any)?.completionTokens ?? Math.ceil(responseText.length / 4);
    } catch (err: any) {
      console.warn('Zen gateway generation timed out or failed after retry:', err);
      // Graceful provider failure fallback (Section 5.3 Non-Negotiable)
      responseText = "I'm having trouble connecting to my clinical AI model right now. Please refer directly to the verified question explanation and BNF references above.";
      promptTokens = Math.ceil(completeUserPrompt.length / 4);
      completionTokens = Math.ceil(responseText.length / 4);
    }

    const latencyMs = Date.now() - startTime;

    // Log assistant message into D1
    await db.insert(aceMessages).values({
      id: assistantMessageId,
      threadId,
      role: 'assistant',
      content: responseText,
      intent,
      retrievedChunkIds: JSON.stringify(retrievedChunkIds),
      citations: JSON.stringify(citations),
      model: modelIdentifier,
      promptTokens,
      completionTokens,
      latencyMs,
      costPence: 0,
      createdAt: new Date(),
    });

    return {
      messageId: assistantMessageId,
      content: responseText,
      model: modelIdentifier,
      promptTokens,
      completionTokens,
      latencyMs,
      costPence: 0,
      retrievedChunkIds,
      citations,
      refused: false,
    };
  }
}
