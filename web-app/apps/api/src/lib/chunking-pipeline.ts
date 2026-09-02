import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { 
  contentChunks, 
  subtopicNotes, 
  questionExplanations, 
  questionOptions, 
  questionContent, 
  questions 
} from '../db/schema';

export interface ChunkResult {
  chunkIndex: number;
  text: string;
  tokenCount: number;
}

/**
 * Text token estimator (~4 characters per token average English/medical text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

/**
 * Semantic chunking for clinical text:
 * Splits by markdown sections (#, ##, ###), double newlines, or table blocks,
 * keeping paragraphs together and targeting 200-500 tokens per chunk with overlap.
 */
export function splitIntoChunks(text: string, maxTokens: number = 400, overlapTokens: number = 50): ChunkResult[] {
  if (!text || text.trim().length === 0) return [];

  // Split by markdown headers or double newlines
  const rawSections = text
    .split(/\n(?=#{1,3}\s)|\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: ChunkResult[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIdx = 0;

  for (const section of rawSections) {
    const sectionTokens = estimateTokens(section);

    if (currentTokens + sectionTokens <= maxTokens) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${section}` : section;
      currentTokens += sectionTokens;
    } else {
      if (currentChunk) {
        chunks.push({
          chunkIndex: chunkIdx++,
          text: currentChunk,
          tokenCount: currentTokens,
        });
      }

      // If a single section exceeds maxTokens, split by sentences/lines
      if (sectionTokens > maxTokens) {
        const lines = section.split(/(?<=[.?!])\s+|\n/);
        let subChunk = '';
        let subTokens = 0;

        for (const line of lines) {
          const lineTokens = estimateTokens(line);
          if (subTokens + lineTokens <= maxTokens) {
            subChunk = subChunk ? `${subChunk} ${line}` : line;
            subTokens += lineTokens;
          } else {
            if (subChunk) {
              chunks.push({
                chunkIndex: chunkIdx++,
                text: subChunk,
                tokenCount: subTokens,
              });
            }
            subChunk = line;
            subTokens = lineTokens;
          }
        }
        if (subChunk) {
          currentChunk = subChunk;
          currentTokens = subTokens;
        } else {
          currentChunk = '';
          currentTokens = 0;
        }
      } else {
        currentChunk = section;
        currentTokens = sectionTokens;
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIdx++,
      text: currentChunk,
      tokenCount: currentTokens,
    });
  }

  return chunks;
}

/**
 * Pipeline to chunk and write content_chunks rows and upsert embeddings into Vectorize when a Subtopic Note is published.
 */
export async function chunkSubtopicNote(
  db: ReturnType<typeof drizzle>,
  subtopicId: string,
  contentMarkdown: string,
  ai?: any,
  vectorize?: any
): Promise<number> {
  // 1. Clear existing chunks for this subtopic note to prevent stale vector embeddings
  const existingChunks = await db
    .select({ id: contentChunks.id })
    .from(contentChunks)
    .where(
      and(
        eq(contentChunks.sourceType, 'subtopic_note'),
        eq(contentChunks.sourceId, subtopicId)
      )
    );

  if (existingChunks.length > 0 && vectorize) {
    try {
      await vectorize.deleteByIds(existingChunks.map((c) => c.id));
    } catch (err) {
      console.warn('Vectorize deleteByIds note error:', err);
    }
  }

  await db
    .delete(contentChunks)
    .where(
      and(
        eq(contentChunks.sourceType, 'subtopic_note'),
        eq(contentChunks.sourceId, subtopicId)
      )
    );

  // 2. Perform semantic chunking
  const chunks = splitIntoChunks(contentMarkdown, 400, 40);
  const now = new Date();

  // 3. Write content_chunks rows & Embed into Vectorize
  if (chunks.length > 0) {
    const chunkRows = chunks.map((chunk) => {
      const chunkId = `chunk-note-${subtopicId}-${chunk.chunkIndex}`;
      return {
        id: chunkId,
        sourceType: 'subtopic_note' as const,
        sourceId: subtopicId,
        chunkIndex: chunk.chunkIndex,
        contentText: chunk.text,
        tokenCount: chunk.tokenCount,
        vectorizeId: `vec-${chunkId}`,
        updatedAt: now,
      };
    });

    await db.insert(contentChunks).values(chunkRows);

    // 4. Generate Workers AI Embeddings and Upsert into Vectorize
    if (ai && vectorize) {
      try {
        const textArray = chunks.map((c) => c.text);
        const embeddingsResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
          text: textArray,
        });

        const vectors = chunks.map((c, i) => ({
          id: `chunk-note-${subtopicId}-${c.chunkIndex}`, // Keyed by D1 chunk id
          values: embeddingsResponse.data[i],
          metadata: {
            sourceType: 'subtopic_note',
            sourceId: subtopicId,
            chunkIndex: c.chunkIndex,
          },
        }));

        await vectorize.upsert(vectors);
      } catch (err) {
        console.warn('Workers AI / Vectorize embedding error for subtopic note:', err);
      }
    }
  }

  return chunks.length;
}

/**
 * Pipeline to chunk and write content_chunks rows and upsert embeddings into Vectorize when a Question is published.
 * Includes stem, lead-in, summary takeaway, detailed explanation, and option rationales.
 */
export async function chunkQuestionOnPublish(
  db: ReturnType<typeof drizzle>,
  questionId: string,
  ai?: any,
  vectorize?: any
): Promise<number> {
  // 1. Clear existing chunks for this question
  const existingChunks = await db
    .select({ id: contentChunks.id })
    .from(contentChunks)
    .where(
      and(
        eq(contentChunks.sourceType, 'explanation'),
        eq(contentChunks.sourceId, questionId)
      )
    );

  if (existingChunks.length > 0 && vectorize) {
    try {
      await vectorize.deleteByIds(existingChunks.map((c) => c.id));
    } catch (err) {
      console.warn('Vectorize deleteByIds question error:', err);
    }
  }

  await db
    .delete(contentChunks)
    .where(
      and(
        eq(contentChunks.sourceType, 'explanation'),
        eq(contentChunks.sourceId, questionId)
      )
    );

  // 2. Fetch question details, content, explanation, and option rationales
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

  const options = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.questionId, questionId));

  if (!content || !explanation) return 0;

  // 3. Assemble rich clinical content document for RAG indexing
  const optionRationalesText = options
    .map((opt) => `Option ${opt.label} (${opt.isCorrect ? 'Correct Answer' : 'Incorrect'}): ${opt.content}\nRationale: ${opt.rationale}`)
    .join('\n\n');

  const fullQuestionDoc = `
# Clinical Scenario:
${content.stem}

## Question Lead-In:
${content.leadIn}

## Key Takeaway:
${explanation.summaryTakeaway}

## Detailed Clinical Explanation & Guidance:
${explanation.detailedExplanation}
${explanation.clinicalGuidanceReference ? `\nGuidance Reference: ${explanation.clinicalGuidanceReference}` : ''}

## Option Analysis:
${optionRationalesText}
  `.trim();

  // 4. Perform semantic chunking
  const chunks = splitIntoChunks(fullQuestionDoc, 450, 50);
  const now = new Date();

  // 5. Insert content_chunks rows
  if (chunks.length > 0) {
    const chunkRows = chunks.map((chunk) => {
      const chunkId = `chunk-q-${questionId}-${chunk.chunkIndex}`;
      return {
        id: chunkId,
        sourceType: 'explanation' as const,
        sourceId: questionId,
        chunkIndex: chunk.chunkIndex,
        contentText: chunk.text,
        tokenCount: chunk.tokenCount,
        vectorizeId: `vec-${chunkId}`,
        updatedAt: now,
      };
    });

    await db.insert(contentChunks).values(chunkRows);

    // 6. Generate Workers AI Embeddings and Upsert into Vectorize
    if (ai && vectorize) {
      try {
        const textArray = chunks.map((c) => c.text);
        const embeddingsResponse = await ai.run('@cf/baai/bge-base-en-v1.5', {
          text: textArray,
        });

        const vectors = chunks.map((c, i) => ({
          id: `chunk-q-${questionId}-${c.chunkIndex}`, // Keyed by D1 chunk id
          values: embeddingsResponse.data[i],
          metadata: {
            sourceType: 'explanation',
            sourceId: questionId,
            chunkIndex: c.chunkIndex,
          },
        }));

        await vectorize.upsert(vectors);
      } catch (err) {
        console.warn('Workers AI / Vectorize embedding error for question explanation:', err);
      }
    }
  }

  return chunks.length;
}
