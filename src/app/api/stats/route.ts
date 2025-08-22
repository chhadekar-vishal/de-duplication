import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

/**
 * GET /api/stats
 * 
 * Get system statistics including file counts and processing status
 * 
 * Response: JSON with various system statistics
 */
export async function GET() {
  try {
    console.log('📊 Fetching system statistics');
    
    const stats = await db.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalFiles: stats.totalFiles,
        uniqueHashes: stats.uniqueHashes,
        duplicatesSaved: stats.totalFiles - stats.uniqueHashes,
        processing: stats.processingStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
