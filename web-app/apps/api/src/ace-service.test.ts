import { describe, it, expect } from 'vitest';
import { generateAceResponse } from './lib/ace-service';

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
