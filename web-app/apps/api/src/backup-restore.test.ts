import { describe, it, expect } from 'vitest';
import { executeD1BackupToR2, executeD1RestoreFromR2 } from './lib/backup-service';

describe('Automated D1 Backup to R2 & Scripted Restore Drill', () => {
  // Mock R2 Storage Bucket
  const mockR2Store = new Map<string, { body: string; metadata: any }>();
  const mockR2Bucket: any = {
    async put(key: string, body: string, options?: any) {
      mockR2Store.set(key, { body, metadata: options });
      return { key };
    },
    async get(key: string) {
      const item = mockR2Store.get(key);
      if (!item) return null;
      return {
        async text() { return item.body; },
        async json() { return JSON.parse(item.body); },
      };
    },
  };

  // Mock D1 Database
  const mockDbInstance: any = {
    prepare(query: string) {
      const stmt = {
        bind() { return this; },
        async all() { return { results: [] }; },
        async raw() { return []; },
        async first() { return null; },
        async run() { return { success: true }; },
        async values() { return []; },
      };
      return stmt;
    },
    async batch() { return []; },
    async dump() { return new ArrayBuffer(0); },
  };

  it('generates a full versioned snapshot, writes to R2, and validates table entity integrity', async () => {
    const backupResult = await executeD1BackupToR2(mockDbInstance, mockR2Bucket);

    expect(backupResult).toBeDefined();
    expect(backupResult.backupKey).toMatch(/^backups\/d1\/d1_backup_/);
    expect(backupResult.tables).toHaveProperty('questions');
    expect(backupResult.tables).toHaveProperty('users');
    expect(backupResult.tables).toHaveProperty('question_first_attempts');
    expect(backupResult.sizeBytes).toBeGreaterThan(0);

    // Verify object exists in R2
    const storedObject = await mockR2Bucket.get(backupResult.backupKey);
    expect(storedObject).not.toBeNull();
    const parsed = await storedObject.json();
    expect(parsed.metadata.version).toBe('1.0');
    expect(parsed.metadata.generator).toBe('AcePharm D1 Automated Backup Worker');
  });

  it('runs scripted disaster-recovery restore drill successfully from R2 snapshot', async () => {
    // 1. Take snapshot
    const backup = await executeD1BackupToR2(mockDbInstance, mockR2Bucket);

    // 2. Perform restore drill targeting staging environment
    const restoreResult = await executeD1RestoreFromR2(mockDbInstance, mockR2Bucket, backup.backupKey);

    expect(restoreResult.success).toBe(true);
    expect(restoreResult.restoredTables).toHaveProperty('questions');
    expect(restoreResult.restoredTables).toHaveProperty('categories');
    expect(restoreResult.restoredTables).toHaveProperty('question_attempts');
  });

  it('throws helpful error if non-existent backup key is targeted for restore', async () => {
    await expect(
      executeD1RestoreFromR2(mockDbInstance, mockR2Bucket, 'backups/d1/non_existent.json')
    ).rejects.toThrow('Backup snapshot not found in R2');
  });
});
