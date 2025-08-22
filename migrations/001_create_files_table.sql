-- Migration: Create files table for de-duplication system
-- File: 001_create_files_table.sql
-- Description: Initial schema for file de-duplication system

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create files table with all required fields
CREATE TABLE files (
    -- Primary key: UUID for better distribution and security
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- File metadata
    file_name VARCHAR(255) NOT NULL,
    file_hash CHAR(64) NOT NULL,  -- SHA-256 hash (64 hex characters)
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    mime_type VARCHAR(100) NOT NULL,
    
    -- Processing information
    chunk_count INTEGER DEFAULT 0 CHECK (chunk_count >= 0),
    processing_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on file_hash to prevent duplicates
-- This is the core of our de-duplication strategy
CREATE UNIQUE INDEX idx_files_hash ON files (file_hash);

-- Create index on created_at for efficient time-based queries
CREATE INDEX idx_files_created_at ON files (created_at DESC);

-- Create index on processing_status for monitoring queries
CREATE INDEX idx_files_processing_status ON files (processing_status);

-- Create composite index for common queries
CREATE INDEX idx_files_status_created ON files (processing_status, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE files IS 'Stores metadata for uploaded files with SHA-256 de-duplication';
COMMENT ON COLUMN files.id IS 'Unique identifier for each file record';
COMMENT ON COLUMN files.file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN files.file_hash IS 'SHA-256 hash for de-duplication (64 hex characters)';
COMMENT ON COLUMN files.file_size IS 'File size in bytes';
COMMENT ON COLUMN files.mime_type IS 'MIME type of the uploaded file';
COMMENT ON COLUMN files.chunk_count IS 'Number of chunks created during RAG processing';
COMMENT ON COLUMN files.processing_status IS 'Current processing status of the file';
COMMENT ON COLUMN files.created_at IS 'Timestamp when file was first uploaded';
COMMENT ON COLUMN files.updated_at IS 'Timestamp when record was last modified';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
INSERT INTO files (file_name, file_hash, file_size, mime_type, processing_status, chunk_count) VALUES
('sample_document.pdf', 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890', 1024000, 'application/pdf', 'completed', 42),
('image.jpg', 'b2c3d4e5f6789012345678901234567890123456789012345678901234567890a1', 2048000, 'image/jpeg', 'completed', 1),
('data.csv', 'c3d4e5f6789012345678901234567890123456789012345678901234567890a1b2', 512000, 'text/csv', 'processing', 0);
*/
