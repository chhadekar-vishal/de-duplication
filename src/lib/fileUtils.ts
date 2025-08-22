import { createHash } from 'crypto';
import { Readable } from 'stream';

/**
 * Utility functions for file hashing and processing
 */

/**
 * Compute SHA-256 hash of a file stream efficiently
 * This approach handles large files without loading them entirely into memory
 * 
 * @param fileBuffer - File buffer or stream
 * @returns Promise resolving to SHA-256 hash string
 */
export async function computeFileHash(fileBuffer: Buffer): Promise<string> {
  console.log(`🔐 Computing SHA-256 hash for ${fileBuffer.length} byte file...`);
  
  const hash = createHash('sha256');
  
  // For demonstration, we're using Buffer, but in production with large files,
  // you'd want to use streams for better memory efficiency
  hash.update(fileBuffer);
  
  const digest = hash.digest('hex');
  console.log(`✅ Hash computed: ${digest}`);
  
  return digest;
}

/**
 * Compute SHA-256 hash from a Node.js stream (for large files)
 * This is the preferred method for handling large files in production
 * 
 * @param stream - Readable stream
 * @returns Promise resolving to SHA-256 hash string
 */
export async function computeStreamHash(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    let totalBytes = 0;
    
    stream.on('data', (chunk) => {
      totalBytes += chunk.length;
      hash.update(chunk);
    });
    
    stream.on('end', () => {
      const digest = hash.digest('hex');
      console.log(`✅ Stream hash computed: ${digest} (${totalBytes} bytes processed)`);
      resolve(digest);
    });
    
    stream.on('error', (error) => {
      console.error('❌ Error computing stream hash:', error);
      reject(error);
    });
  });
}

/**
 * Validate file type and size
 * @param file - File object with size and type information
 * @param maxSizeBytes - Maximum allowed file size in bytes (default: 100MB)
 * @returns Object indicating if file is valid and any error message
 */
export function validateFile(
  file: { size: number; type: string },
  maxSizeBytes: number = 100 * 1024 * 1024 // 100MB default
): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`
    };
  }
  
  // Check for empty files
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    };
  }
  
  // In production, you might want to validate specific MIME types
  // For now, we'll allow all file types
  console.log(`✅ File validation passed: ${file.type}, ${file.size} bytes`);
  
  return { isValid: true };
}

/**
 * Simulate RAG pipeline processing
 * In a real implementation, this would:
 * 1. Extract text from the file
 * 2. Split text into chunks
 * 3. Generate embeddings
 * 4. Store in vector database
 * 
 * @param fileId - ID of the file to process
 * @param fileName - Name of the file
 * @param fileSize - Size of the file in bytes
 * @returns Promise resolving to processing result
 */
export async function simulateRAGProcessing(
  fileId: string,
  fileName: string,
  fileSize: number
): Promise<{ success: boolean; chunkCount: number; processingTimeMs: number }> {
  console.log(`🔄 Starting RAG processing for file: ${fileName} (ID: ${fileId})`);
  
  const startTime = Date.now();
  
  // Simulate processing delay based on file size
  const processingDelay = Math.min(Math.max(fileSize / 10000, 100), 2000); // 100ms to 2s
  
  await new Promise(resolve => setTimeout(resolve, processingDelay));
  
  // Simulate chunk creation based on file size
  // Assuming ~1000 characters per chunk and ~1.5 characters per byte (rough estimate)
  const estimatedChunks = Math.max(1, Math.floor(fileSize / 667)); // ~1000 chars per chunk
  
  const processingTimeMs = Date.now() - startTime;
  
  console.log(`✅ RAG processing completed for ${fileName}: ${estimatedChunks} chunks in ${processingTimeMs}ms`);
  
  return {
    success: true,
    chunkCount: estimatedChunks,
    processingTimeMs
  };
}

/**
 * Generate file metadata for storage
 * @param file - File information
 * @param hash - Computed SHA-256 hash
 * @returns Metadata object ready for database storage
 */
export function generateFileMetadata(
  file: { name: string; size: number; type: string },
  hash: string
) {
  return {
    file_name: file.name,
    file_hash: hash,
    file_size: file.size,
    mime_type: file.type || 'application/octet-stream',
    processing_status: 'pending' as const,
  };
}

/**
 * Format file size for human readability
 * @param bytes - File size in bytes
 * @returns Human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}
