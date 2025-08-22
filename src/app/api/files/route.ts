import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { formatFileSize } from '@/lib/fileUtils';

/**
 * GET /api/files
 * 
 * List all files in the system with pagination
 * 
 * Query parameters:
 * - limit: Number of files to return (default: 50, max: 100)
 * - offset: Number of files to skip (default: 0)
 * 
 * Response: JSON with files array and metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    
    console.log(`📋 Fetching files: limit=${limit}, offset=${offset}`);
    
    // Get files and stats
    const [files, stats] = await Promise.all([
      db.getAllFiles(limit, offset),
      db.getStats()
    ]);
    
    // Format response with additional metadata
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.file_name,
      hash: file.file_hash,
      size: file.file_size,
      sizeFormatted: formatFileSize(file.file_size),
      mimeType: file.mime_type,
      createdAt: file.created_at,
      processingStatus: file.processing_status,
      chunkCount: file.chunk_count || 0
    }));
    
    return NextResponse.json({
      success: true,
      files: formattedFiles,
      pagination: {
        limit,
        offset,
        total: stats.totalFiles,
        hasMore: offset + limit < stats.totalFiles
      },
      stats: {
        totalFiles: stats.totalFiles,
        uniqueHashes: stats.uniqueHashes,
        processing: stats.processingStats
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
