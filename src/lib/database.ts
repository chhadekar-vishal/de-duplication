import { v4 as uuidv4 } from 'uuid';

/**
 * Database schema simulation for file de-duplication system
 * In production, this would be implemented with actual Postgres tables
 */

export interface FileRecord {
  id: string;           // UUID primary key
  file_name: string;    // Original filename
  file_hash: string;    // SHA-256 hash (64 characters)
  file_size: number;    // File size in bytes
  mime_type: string;    // MIME type of the file
  created_at: Date;     // Timestamp when file was first uploaded
  chunk_count?: number; // Number of chunks created during RAG processing
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Simulated in-memory database
 * In production, this would be replaced with actual Postgres database connection
 */
class SimulatedDatabase {
  private files: Map<string, FileRecord> = new Map();
  private hashIndex: Map<string, string> = new Map(); // hash -> id mapping for fast lookups

  /**
   * Create the files table (simulated)
   * In production, this would be a SQL migration
   */
  createTable(): void {
    console.log('📊 Database: Creating files table (simulated)');
    console.log(`
      CREATE TABLE files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name VARCHAR(255) NOT NULL,
        file_hash CHAR(64) UNIQUE NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        chunk_count INTEGER DEFAULT 0,
        processing_status VARCHAR(20) DEFAULT 'pending'
      );
      
      CREATE UNIQUE INDEX idx_files_hash ON files (file_hash);
      CREATE INDEX idx_files_created_at ON files (created_at);
    `);
  }

  /**
   * Insert a new file record
   * @param fileData - File metadata to insert
   * @returns The created file record
   */
  async insertFile(fileData: Omit<FileRecord, 'id' | 'created_at'>): Promise<FileRecord> {
    // Check if hash already exists
    if (this.hashIndex.has(fileData.file_hash)) {
      throw new Error(`File with hash ${fileData.file_hash} already exists`);
    }

    const id = uuidv4();
    const record: FileRecord = {
      id,
      ...fileData,
      created_at: new Date(),
    };

    this.files.set(id, record);
    this.hashIndex.set(fileData.file_hash, id);

    console.log(`✅ Database: Inserted file record with ID ${id}`);
    return record;
  }

  /**
   * Find a file by its hash
   * @param hash - SHA-256 hash to look for
   * @returns File record if found, null otherwise
   */
  async findByHash(hash: string): Promise<FileRecord | null> {
    const id = this.hashIndex.get(hash);
    if (!id) {
      return null;
    }
    return this.files.get(id) || null;
  }

  /**
   * Find a file by its ID
   * @param id - File ID to look for
   * @returns File record if found, null otherwise
   */
  async findById(id: string): Promise<FileRecord | null> {
    return this.files.get(id) || null;
  }

  /**
   * Get all files with pagination
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Array of file records
   */
  async getAllFiles(limit: number = 50, offset: number = 0): Promise<FileRecord[]> {
    const allFiles = Array.from(this.files.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    return allFiles.slice(offset, offset + limit);
  }

  /**
   * Update file processing status
   * @param id - File ID
   * @param status - New processing status
   * @param chunkCount - Optional chunk count if processing completed
   */
  async updateProcessingStatus(
    id: string, 
    status: FileRecord['processing_status'],
    chunkCount?: number
  ): Promise<void> {
    const record = this.files.get(id);
    if (record) {
      record.processing_status = status;
      if (chunkCount !== undefined) {
        record.chunk_count = chunkCount;
      }
      console.log(`📝 Database: Updated file ${id} status to ${status}`);
    }
  }

  /**
   * Get database statistics
   * @returns Object with database stats
   */
  async getStats(): Promise<{
    totalFiles: number;
    uniqueHashes: number;
    processingStats: Record<string, number>;
  }> {
    const totalFiles = this.files.size;
    const uniqueHashes = this.hashIndex.size;
    const processingStats: Record<string, number> = {};

    // Convert Map values to array for iteration
    const filesArray = Array.from(this.files.values());
    for (const file of filesArray) {
      processingStats[file.processing_status] = (processingStats[file.processing_status] || 0) + 1;
    }

    return {
      totalFiles,
      uniqueHashes,
      processingStats,
    };
  }
}

// Singleton instance for the simulated database
export const db = new SimulatedDatabase();

// Initialize the database
db.createTable();
