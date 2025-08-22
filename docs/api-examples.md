# API Examples

This document provides practical examples of how to use the File De-duplication System API.

## Upload File Examples

### Upload a PDF Document

```bash
# Create a test PDF file
echo "PDF content goes here" > test-document.pdf

# Upload the file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-document.pdf" \
  -H "Accept: application/json"
```

**Response (First Upload):**
```json
{
  "success": true,
  "duplicate": false,
  "message": "File uploaded successfully and processing started",
  "file": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "test-document.pdf",
    "hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    "size": 24,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "processingStatus": "pending"
  }
}
```

### Upload the Same File Again (Duplicate Detection)

```bash
# Upload the same file again
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-document.pdf" \
  -H "Accept: application/json"
```

**Response (Duplicate Detected):**
```json
{
  "success": true,
  "duplicate": true,
  "message": "File already exists in the system",
  "file": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "test-document.pdf",
    "hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    "size": 24,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "processingStatus": "completed",
    "chunkCount": 3
  }
}
```

## Check Duplicate Examples

### Check if Hash Exists

```bash
# Check for an existing hash
curl "http://localhost:3000/api/check-duplicate/2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae" \
  -H "Accept: application/json"
```

**Response (Hash Found):**
```json
{
  "duplicate": true,
  "file": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "test-document.pdf",
    "hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    "size": 24,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "processingStatus": "completed",
    "chunkCount": 3
  }
}
```

### Check Non-Existent Hash

```bash
# Check for a non-existent hash
curl "http://localhost:3000/api/check-duplicate/nonexistent1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \
  -H "Accept: application/json"
```

**Response (Hash Not Found):**
```json
{
  "duplicate": false,
  "message": "No file found with this hash"
}
```

## List Files Examples

### Get First Page of Files

```bash
# Get first 10 files
curl "http://localhost:3000/api/files?limit=10&offset=0" \
  -H "Accept: application/json"
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "test-document.pdf",
      "hash": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
      "size": 24,
      "sizeFormatted": "24 B",
      "mimeType": "application/pdf",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "processingStatus": "completed",
      "chunkCount": 3
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1,
    "hasMore": false
  },
  "stats": {
    "totalFiles": 1,
    "uniqueHashes": 1,
    "processing": {
      "completed": 1
    }
  }
}
```

### Get System Statistics

```bash
# Get system stats
curl "http://localhost:3000/api/stats" \
  -H "Accept: application/json"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 1,
    "uniqueHashes": 1,
    "duplicatesSaved": 0,
    "processing": {
      "completed": 1
    },
    "timestamp": "2025-01-15T10:35:00.000Z"
  }
}
```

## JavaScript/TypeScript Client Examples

### Upload File with Fetch API

```typescript
async function uploadFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  try {
    const result = await uploadFile(file);
    if (result.duplicate) {
      console.log('Duplicate file detected:', result.file);
    } else {
      console.log('New file uploaded:', result.file);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
}
```

### Check for Duplicates Before Upload

```typescript
import crypto from 'crypto';

async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = crypto.createHash('sha256');
  hash.update(new Uint8Array(arrayBuffer));
  return hash.digest('hex');
}

async function checkDuplicateBeforeUpload(file: File): Promise<boolean> {
  // Compute hash on client side
  const hash = await computeFileHash(file);
  
  // Check if file already exists
  const response = await fetch(`/api/check-duplicate/${hash}`);
  const result = await response.json();
  
  return result.duplicate;
}

// Usage
const file = fileInput.files?.[0];
if (file) {
  const isDuplicate = await checkDuplicateBeforeUpload(file);
  
  if (isDuplicate) {
    alert('This file has already been uploaded!');
  } else {
    // Proceed with upload
    await uploadFile(file);
  }
}
```

### React Hook for File Upload

```typescript
import { useState, useCallback } from 'react';

interface UploadResult {
  success: boolean;
  duplicate: boolean;
  file: any;
  message: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
```

## Python Client Examples

### Upload File with Python Requests

```python
import requests
import hashlib
import json

def upload_file(file_path: str, api_base_url: str = "http://localhost:3000") -> dict:
    """Upload a file to the de-duplication system."""
    
    with open(file_path, 'rb') as file:
        files = {'file': (file_path, file, 'application/octet-stream')}
        response = requests.post(f"{api_base_url}/api/upload", files=files)
    
    response.raise_for_status()
    return response.json()

def compute_file_hash(file_path: str) -> str:
    """Compute SHA-256 hash of a file."""
    
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as file:
        for chunk in iter(lambda: file.read(4096), b""):
            sha256_hash.update(chunk)
    
    return sha256_hash.hexdigest()

def check_duplicate(file_hash: str, api_base_url: str = "http://localhost:3000") -> dict:
    """Check if a file hash already exists."""
    
    response = requests.get(f"{api_base_url}/api/check-duplicate/{file_hash}")
    response.raise_for_status()
    return response.json()

# Usage examples
if __name__ == "__main__":
    file_path = "test-document.pdf"
    
    # Method 1: Upload directly
    result = upload_file(file_path)
    print(f"Upload result: {json.dumps(result, indent=2)}")
    
    # Method 2: Check hash first, then upload if needed
    file_hash = compute_file_hash(file_path)
    duplicate_check = check_duplicate(file_hash)
    
    if duplicate_check['duplicate']:
        print(f"File already exists: {duplicate_check['file']}")
    else:
        print("File is new, uploading...")
        upload_result = upload_file(file_path)
        print(f"Upload completed: {upload_result}")
```

### Async Python Client

```python
import aiohttp
import asyncio
import hashlib
from pathlib import Path

class AsyncDedupClient:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url

    async def upload_file(self, session: aiohttp.ClientSession, file_path: Path) -> dict:
        """Upload a file asynchronously."""
        
        with open(file_path, 'rb') as file:
            data = aiohttp.FormData()
            data.add_field('file', file, filename=file_path.name)
            
            async with session.post(f"{self.base_url}/api/upload", data=data) as response:
                response.raise_for_status()
                return await response.json()

    async def check_duplicate(self, session: aiohttp.ClientSession, file_hash: str) -> dict:
        """Check for duplicate asynchronously."""
        
        async with session.get(f"{self.base_url}/api/check-duplicate/{file_hash}") as response:
            response.raise_for_status()
            return await response.json()

    async def get_stats(self, session: aiohttp.ClientSession) -> dict:
        """Get system statistics."""
        
        async with session.get(f"{self.base_url}/api/stats") as response:
            response.raise_for_status()
            return await response.json()

# Usage
async def main():
    client = AsyncDedupClient()
    
    async with aiohttp.ClientSession() as session:
        # Upload multiple files concurrently
        files = [Path("file1.txt"), Path("file2.txt"), Path("file3.txt")]
        
        upload_tasks = [client.upload_file(session, file_path) for file_path in files]
        results = await asyncio.gather(*upload_tasks, return_exceptions=True)
        
        for file_path, result in zip(files, results):
            if isinstance(result, Exception):
                print(f"Error uploading {file_path}: {result}")
            else:
                print(f"Uploaded {file_path}: duplicate={result['duplicate']}")
        
        # Get final stats
        stats = await client.get_stats(session)
        print(f"System stats: {stats}")

# Run the async example
# asyncio.run(main())
```

## Error Handling Examples

### Handle Upload Errors

```bash
# Try to upload a file that's too large
curl -X POST http://localhost:3000/api/upload \
  -F "file=@large-file.zip" \
  -H "Accept: application/json"
```

**Error Response:**
```json
{
  "error": "File size (150MB) exceeds maximum allowed size (100MB)"
}
```

### Handle Invalid Hash Format

```bash
# Try to check with invalid hash
curl "http://localhost:3000/api/check-duplicate/invalid-hash" \
  -H "Accept: application/json"
```

**Error Response:**
```json
{
  "error": "Invalid hash format. Expected 64-character hexadecimal string."
}
```

### JavaScript Error Handling

```typescript
async function uploadWithErrorHandling(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      console.error('Network error:', error.message);
      throw new Error('Network connection failed. Please try again.');
    } else if (error instanceof Error) {
      // API error
      console.error('API error:', error.message);
      throw error;
    } else {
      // Unknown error
      console.error('Unknown error:', error);
      throw new Error('An unexpected error occurred.');
    }
  }
}
```

These examples demonstrate the comprehensive API usage patterns for the file de-duplication system, covering both client-side and server-side integrations with proper error handling.
