/**
 * Test suite for database operations
 * Tests file storage, duplicate detection, and query operations
 */

import { db, FileRecord } from '../src/lib/database';

describe('Database Operations', () => {
  // Clear database before each test
  beforeEach(() => {
    // Reset the simulated database
    (db as any).files = new Map();
    (db as any).hashIndex = new Map();
  });

  describe('insertFile', () => {
    it('should insert a new file successfully', async () => {
      const fileData = {
        file_name: 'test.pdf',
        file_hash: 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
        file_size: 1024,
        mime_type: 'application/pdf',
        processing_status: 'pending' as const
      };

      const result = await db.insertFile(fileData);

      expect(result.id).toBeDefined();
      expect(result.file_name).toBe(fileData.file_name);
      expect(result.file_hash).toBe(fileData.file_hash);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should prevent duplicate hashes', async () => {
      const fileData = {
        file_name: 'test.pdf',
        file_hash: 'duplicate_hash_123456789012345678901234567890123456789012345678',
        file_size: 1024,
        mime_type: 'application/pdf',
        processing_status: 'pending' as const
      };

      // Insert first file
      await db.insertFile(fileData);

      // Attempt to insert duplicate
      await expect(db.insertFile(fileData)).rejects.toThrow('already exists');
    });
  });

  describe('findByHash', () => {
    it('should find existing file by hash', async () => {
      const fileData = {
        file_name: 'findme.txt',
        file_hash: 'findable_hash_1234567890123456789012345678901234567890123456789',
        file_size: 512,
        mime_type: 'text/plain',
        processing_status: 'completed' as const
      };

      const inserted = await db.insertFile(fileData);
      const found = await db.findByHash(fileData.file_hash);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(inserted.id);
      expect(found!.file_name).toBe(fileData.file_name);
    });

    it('should return null for non-existent hash', async () => {
      const result = await db.findByHash('nonexistent_hash_1234567890123456789012345678901234567890123');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find existing file by ID', async () => {
      const fileData = {
        file_name: 'byid.txt',
        file_hash: 'byid_hash_12345678901234567890123456789012345678901234567890123',
        file_size: 256,
        mime_type: 'text/plain',
        processing_status: 'pending' as const
      };

      const inserted = await db.insertFile(fileData);
      const found = await db.findById(inserted.id);

      expect(found).not.toBeNull();
      expect(found!.file_name).toBe(fileData.file_name);
    });

    it('should return null for non-existent ID', async () => {
      const result = await db.findById('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('updateProcessingStatus', () => {
    it('should update processing status', async () => {
      const fileData = {
        file_name: 'status.txt',
        file_hash: 'status_hash_123456789012345678901234567890123456789012345678901',
        file_size: 128,
        mime_type: 'text/plain',
        processing_status: 'pending' as const
      };

      const inserted = await db.insertFile(fileData);
      await db.updateProcessingStatus(inserted.id, 'completed', 5);

      const updated = await db.findById(inserted.id);
      expect(updated!.processing_status).toBe('completed');
      expect(updated!.chunk_count).toBe(5);
    });
  });

  describe('getAllFiles', () => {
    it('should return paginated results', async () => {
      // Insert multiple files
      for (let i = 0; i < 5; i++) {
        await db.insertFile({
          file_name: `file${i}.txt`,
          file_hash: `hash${i}_${'0'.repeat(57)}${i}`,
          file_size: 100 + i,
          mime_type: 'text/plain',
          processing_status: 'pending'
        });
      }

      const firstPage = await db.getAllFiles(3, 0);
      const secondPage = await db.getAllFiles(3, 3);

      expect(firstPage).toHaveLength(3);
      expect(secondPage).toHaveLength(2);
      
      // Should be sorted by creation date (newest first)
      expect(firstPage[0].created_at.getTime()).toBeGreaterThanOrEqual(
        firstPage[1].created_at.getTime()
      );
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      // Insert files with different statuses
      await db.insertFile({
        file_name: 'pending.txt',
        file_hash: 'pending_hash_123456789012345678901234567890123456789012345678901',
        file_size: 100,
        mime_type: 'text/plain',
        processing_status: 'pending'
      });

      const completed = await db.insertFile({
        file_name: 'completed.txt',
        file_hash: 'completed_hash_12345678901234567890123456789012345678901234567890',
        file_size: 200,
        mime_type: 'text/plain',
        processing_status: 'completed'
      });

      await db.updateProcessingStatus(completed.id, 'completed', 3);

      const stats = await db.getStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.uniqueHashes).toBe(2);
      expect(stats.processingStats.pending).toBe(1);
      expect(stats.processingStats.completed).toBe(1);
    });
  });
});
