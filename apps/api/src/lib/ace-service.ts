import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray } from 'drizzle-orm';
import { generateText, streamText } from 'ai';
import { contentChunks, aceMessages, aceUsage, questions, questionExplanations } from '../db/schema';
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
  streamResult?: any;
}

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
  topK: number = 4
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

    // 2. Query Vectorize
    const matches = await vectorize.query(queryVector, {
      topK,
      returnMetadata: true,
    });

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

    return rows.map((r) => ({
      id: r.id,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      chunkIndex: r.chunkIndex,
      contentText: r.contentText,
      score: scoreMap.get(r.id) || 0,
    }));
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

  const citations: CitationItem[] = retrievedChunks.map((c) => ({
    id: c.id,
    sourceType: c.sourceType,
    sourceId: c.sourceId,
  }));

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
      streamResult,
    };
  } else {
    // Non-streaming synchronous fallback
    let responseText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: completeUserPrompt,
      });

      responseText = result.text;
      promptTokens = (result.usage as any)?.inputTokens ?? (result.usage as any)?.promptTokens ?? Math.ceil(completeUserPrompt.length / 4);
      completionTokens = (result.usage as any)?.outputTokens ?? (result.usage as any)?.completionTokens ?? Math.ceil(responseText.length / 4);
    } catch (err: any) {
      console.error('Zen gateway generation error:', err);
      // Graceful provider failure fallback
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
    };
  }
}
