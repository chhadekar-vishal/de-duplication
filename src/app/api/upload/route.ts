import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { 
  computeFileHash, 
  validateFile, 
  generateFileMetadata, 
  simulateRAGProcessing 
} from '@/lib/fileUtils';

/**
 * POST /api/upload
 * 
 * Upload a file and check for duplicates using SHA-256 hashing
 * 
 * Request: multipart/form-data with 'file' field
 * Response: JSON with file information and duplicate status
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload request received');
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📁 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Convert file to buffer and compute hash
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = await computeFileHash(buffer);
    
    // Check if file already exists (duplicate detection)
    const existingFile = await db.findByHash(fileHash);
    
    if (existingFile) {
      console.log(`🔄 Duplicate file detected! Existing file ID: ${existingFile.id}`);
      
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'File already exists in the system',
        file: {
          id: existingFile.id,
          name: existingFile.file_name,
          hash: existingFile.file_hash,
          size: existingFile.file_size,
          mimeType: existingFile.mime_type,
          createdAt: existingFile.created_at,
          processingStatus: existingFile.processing_status,
          chunkCount: existingFile.chunk_count
        }
      });
    }
    
    // File is new - store metadata
    const metadata = generateFileMetadata(file, fileHash);
    const newFile = await db.insertFile(metadata);
    
    console.log(`💾 New file stored with ID: ${newFile.id}`);
    
    // Start RAG processing in background (simulated)
    // In production, this would be queued to a background job system
    processFileInBackground(newFile.id, file.name, file.size);
    
    return NextResponse.json({
      success: true,
      duplicate: false,
      message: 'File uploaded successfully and processing started',
      file: {
        id: newFile.id,
        name: newFile.file_name,
        hash: newFile.file_hash,
        size: newFile.file_size,
        mimeType: newFile.mime_type,
        createdAt: newFile.created_at,
        processingStatus: newFile.processing_status
      }
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Simulate background processing of the file
 * In production, this would be handled by a queue system like Bull, Sidekiq, etc.
 */
async function processFileInBackground(fileId: string, fileName: string, fileSize: number) {
  try {
    // Update status to processing
    await db.updateProcessingStatus(fileId, 'processing');
    
    // Simulate RAG pipeline processing
    const result = await simulateRAGProcessing(fileId, fileName, fileSize);
    
    if (result.success) {
      // Update status to completed with chunk count
      await db.updateProcessingStatus(fileId, 'completed', result.chunkCount);
    } else {
      // Update status to failed
      await db.updateProcessingStatus(fileId, 'failed');
    }
    
  } catch (error) {
    console.error(`❌ Background processing failed for file ${fileId}:`, error);
    await db.updateProcessingStatus(fileId, 'failed');
  }
}
