import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

/**
 * GET /api/check-duplicate/[hash]
 * 
 * Check if a file with the given SHA-256 hash already exists
 * 
 * Parameters:
 * - hash: SHA-256 hash string (64 characters)
 * 
 * Response: JSON with duplicate status and file information if found
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await context.params;
    
    console.log(`🔍 Checking for duplicate with hash: ${hash}`);
    
    // Validate hash format (SHA-256 should be 64 hex characters)
    if (!hash || hash.length !== 64 || !/^[a-f0-9]+$/i.test(hash)) {
      return NextResponse.json(
        { error: 'Invalid hash format. Expected 64-character hexadecimal string.' },
        { status: 400 }
      );
    }
    
    // Look up file by hash
    const existingFile = await db.findByHash(hash.toLowerCase());
    
    if (existingFile) {
      console.log(`✅ Duplicate found: ${existingFile.file_name} (ID: ${existingFile.id})`);
      
      return NextResponse.json({
        duplicate: true,
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
    } else {
      console.log(`📭 No duplicate found for hash: ${hash}`);
      
      return NextResponse.json({
        duplicate: false,
        message: 'No file found with this hash'
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking duplicate:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
