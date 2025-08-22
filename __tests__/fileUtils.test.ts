/**
 * Test suite for file utilities
 * Tests SHA-256 hashing, file validation, and RAG processing simulation
 */

import { 
  computeFileHash, 
  validateFile, 
  generateFileMetadata, 
  simulateRAGProcessing,
  formatFileSize 
} from '../src/lib/fileUtils';

describe('File Utilities', () => {
  describe('computeFileHash', () => {
    it('should compute correct SHA-256 hash for known input', async () => {
      const testData = Buffer.from('Hello, World!', 'utf8');
      const hash = await computeFileHash(testData);
      
      // Expected SHA-256 hash for "Hello, World!"
      const expectedHash = 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f';
      
      expect(hash).toBe(expectedHash);
      expect(hash).toHaveLength(64);
    });

    it('should produce different hashes for different content', async () => {
      const buffer1 = Buffer.from('content1', 'utf8');
      const buffer2 = Buffer.from('content2', 'utf8');
      
      const hash1 = await computeFileHash(buffer1);
      const hash2 = await computeFileHash(buffer2);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash2).toHaveLength(64);
    });

    it('should produce same hash for identical content', async () => {
      const content = 'identical content';
      const buffer1 = Buffer.from(content, 'utf8');
      const buffer2 = Buffer.from(content, 'utf8');
      
      const hash1 = await computeFileHash(buffer1);
      const hash2 = await computeFileHash(buffer2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('validateFile', () => {
    it('should accept valid files', () => {
      const validFile = { size: 1024, type: 'text/plain' };
      const result = validateFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeFile = { size: 200 * 1024 * 1024, type: 'application/pdf' }; // 200MB
      const result = validateFile(largeFile, 100 * 1024 * 1024); // 100MB limit
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject empty files', () => {
      const emptyFile = { size: 0, type: 'text/plain' };
      const result = validateFile(emptyFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is empty');
    });
  });

  describe('generateFileMetadata', () => {
    it('should generate correct metadata structure', () => {
      const file = {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf'
      };
      const hash = 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234';
      
      const metadata = generateFileMetadata(file, hash);
      
      expect(metadata).toEqual({
        file_name: 'test.pdf',
        file_hash: hash,
        file_size: 1024,
        mime_type: 'application/pdf',
        processing_status: 'pending'
      });
    });

    it('should handle missing MIME type', () => {
      const file = {
        name: 'unknown.file',
        size: 512,
        type: ''
      };
      const hash = 'test_hash_64_characters_long_1234567890abcdef1234567890abcdef123';
      
      const metadata = generateFileMetadata(file, hash);
      
      expect(metadata.mime_type).toBe('application/octet-stream');
    });
  });

  describe('simulateRAGProcessing', () => {
    it('should return processing results', async () => {
      const result = await simulateRAGProcessing('test-id', 'test.txt', 1000);
      
      expect(result.success).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should scale chunk count with file size', async () => {
      const smallResult = await simulateRAGProcessing('test-1', 'small.txt', 1000);
      const largeResult = await simulateRAGProcessing('test-2', 'large.txt', 10000);
      
      expect(largeResult.chunkCount).toBeGreaterThanOrEqual(smallResult.chunkCount);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle fractional sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5KB
      expect(formatFileSize(2621440)).toBe('2.5 MB'); // 2.5MB
    });
  });
});
