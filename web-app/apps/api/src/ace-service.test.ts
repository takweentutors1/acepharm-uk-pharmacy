import { describe, it, expect } from 'vitest';
import { generateAceResponse, resolveCitationLabels, type RetrievedChunk } from './lib/ace-service';
import { subtopics, questions, references } from './db/schema';

function mockDbFor(rowsByTable: Map<any, any[]>) {
  return {
    select: () => ({
      from: (table: any) => ({
        where: async () => rowsByTable.get(table) ?? [],
      }),
    }),
  } as any;
}

describe('generateAceResponse Provider-Agnostic Interface (Section 5.4)', () => {
  it('exports generateAceResponse with complete interface signature', () => {
    expect(typeof generateAceResponse).toBe('function');
  });

  it('handles empty retrieval gracefully without throwing', async () => {
    // Mock DB instance
    const mockDb: any = {
      insert: () => ({
        values: async () => {},
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      }),
    };

    const res = await generateAceResponse({
      db: mockDb,
      userId: 'user-test-123',
      threadId: 'thread-test-456',
      contextType: 'question',
      userPrompt: 'Can I prescribe metformin in stage 5 CKD?',
      intent: 'whynot',
      stream: false,
    });

    expect(res).toBeDefined();
    expect(res.messageId).toContain('msg-ast-');
    expect(res.model).toBe('mimo-v2.5-free');
    expect(res.retrievedChunkIds).toEqual([]);
    expect(res.citations).toEqual([]);
    expect(res.costPence).toBe(0);
  });
});

describe('resolveCitationLabels', () => {
  const baseChunk = (overrides: Partial<RetrievedChunk>): RetrievedChunk => ({
    id: 'chunk-1',
    sourceType: 'subtopic_note',
    sourceId: 'sub-1',
    chunkIndex: 0,
    contentText: 'irrelevant',
    ...overrides,
  });

  it('labels a subtopic_note citation with the subtopic name', async () => {
    const db = mockDbFor(new Map([[subtopics, [{ id: 'sub-1', name: 'Cardiovascular Therapeutics' }]]]));
    const result = await resolveCitationLabels(db, [baseChunk({ sourceType: 'subtopic_note', sourceId: 'sub-1' })]);

    expect(result[0].label).toBe('Cardiovascular Therapeutics — subtopic notes');
  });

  it('labels an explanation citation with the question public ID', async () => {
    const db = mockDbFor(new Map([[questions, [{ id: 'q-1', publicId: 'ACP-CV-0012' }]]]));
    const result = await resolveCitationLabels(db, [
      baseChunk({ id: 'chunk-2', sourceType: 'explanation', sourceId: 'q-1' }),
    ]);

    expect(result[0].label).toBe('Question ACP-CV-0012 — clinical explanation');
  });

  it('labels a reference citation with the guideline title and URL', async () => {
    const db = mockDbFor(
      new Map([
        [
          references,
          [{ id: 'ref-1', title: 'NG136: Hypertension in adults', sourceName: 'NICE', url: 'https://nice.org.uk/ng136' }],
        ],
      ])
    );
    const result = await resolveCitationLabels(db, [
      baseChunk({ id: 'chunk-3', sourceType: 'reference', sourceId: 'ref-1' }),
    ]);

    expect(result[0].label).toBe('NICE — NG136: Hypertension in adults');
    expect(result[0].url).toBe('https://nice.org.uk/ng136');
  });

  it('leaves label undefined when the source row cannot be resolved', async () => {
    const db = mockDbFor(new Map());
    const result = await resolveCitationLabels(db, [baseChunk({ sourceType: 'subtopic_note', sourceId: 'missing' })]);

    expect(result[0].label).toBeUndefined();
  });
});
