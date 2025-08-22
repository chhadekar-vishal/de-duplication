# File De-duplication System

A secure, scalable, and efficient file de-duplication system designed to avoid re-processing the same files multiple times in RAG (Retrieval-Augmented Generation) pipelines.

## 🎯 Overview

This system uses SHA-256 hashing to identify unique files and prevents duplicate processing by storing file metadata in a database with unique constraints. When a file is uploaded:

1. **If it's a duplicate** → Skip reprocessing and return reference to existing entry
2. **If it's new** → Process the file and store metadata

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: Postgres (simulated in-memory for demo)
- **Hashing**: SHA-256 using Node.js crypto module
- **Styling**: Tailwind CSS

### Core Components

1. **File Hashing (`src/lib/fileUtils.ts`)**
   - Efficient SHA-256 computation using streams
   - File validation and metadata generation
   - RAG processing simulation

2. **Database Layer (`src/lib/database.ts`)**
   - Simulated Postgres database with unique constraints
   - File metadata storage and retrieval
   - Duplicate detection via hash lookup

3. **API Routes (`src/app/api/`)**
   - `/upload` - File upload and duplicate checking
   - `/check-duplicate/[hash]` - Hash-based duplicate lookup
   - `/files` - List all files with pagination
   - `/stats` - System statistics

## 🔗 API Endpoints

### POST `/api/upload`

Upload a file and check for duplicates.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \\
  -F "file=@document.pdf"
```

**Response (New File):**
```json
{
  "success": true,
  "duplicate": false,
  "message": "File uploaded successfully and processing started",
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "document.pdf",
    "hash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "size": 1024000,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "processingStatus": "pending"
  }
}
```

**Response (Duplicate Found):**
```json
{
  "success": true,
  "duplicate": true,
  "message": "File already exists in the system",
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "document.pdf",
    "hash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "size": 1024000,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T09:15:00.000Z",
    "processingStatus": "completed",
    "chunkCount": 42
  }
}
```

### GET `/api/check-duplicate/{hash}`

Check if a file with the given SHA-256 hash exists.

**Request:**
```bash
curl http://localhost:3000/api/check-duplicate/a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890
```

**Response (Found):**
```json
{
  "duplicate": true,
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "document.pdf",
    "hash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "size": 1024000,
    "mimeType": "application/pdf",
    "createdAt": "2025-01-15T09:15:00.000Z",
    "processingStatus": "completed",
    "chunkCount": 42
  }
}
```

**Response (Not Found):**
```json
{
  "duplicate": false,
  "message": "No file found with this hash"
}
```

### GET `/api/files`

List all files with pagination.

**Request:**
```bash
curl "http://localhost:3000/api/files?limit=10&offset=0"
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "document.pdf",
      "hash": "a1b2c3d4e5f6...",
      "size": 1024000,
      "sizeFormatted": "1.0 MB",
      "mimeType": "application/pdf",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "processingStatus": "completed",
      "chunkCount": 42
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

### GET `/api/stats`

Get system statistics.

**Request:**
```bash
curl http://localhost:3000/api/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 150,
    "uniqueHashes": 125,
    "duplicatesSaved": 25,
    "processing": {
      "pending": 5,
      "processing": 2,
      "completed": 140,
      "failed": 3
    },
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🗄️ Database Schema

The system uses a PostgreSQL database with the following schema:

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_hash CHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    chunk_count INTEGER DEFAULT 0,
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_files_hash ON files (file_hash);
CREATE INDEX idx_files_created_at ON files (created_at DESC);
CREATE INDEX idx_files_processing_status ON files (processing_status);
```

See `migrations/001_create_files_table.sql` for the complete migration.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Web interface: http://localhost:3000
   - API endpoints: http://localhost:3000/api/*

4. **Run tests:**
   ```bash
   npm test
   ```

## 🧪 Testing

Upload a test file:

```bash
# Create a test file
echo "Hello, World!" > test.txt

# Upload it
curl -X POST http://localhost:3000/api/upload \\
  -F "file=@test.txt"

# Upload the same file again (should detect duplicate)
curl -X POST http://localhost:3000/api/upload \\
  -F "file=@test.txt"
```

## 🎯 Why SHA-256 De-duplication is Important in RAG Pipelines

### 1. **Cost Efficiency**
- **Processing Costs**: RAG pipelines involve expensive operations like text extraction, embedding generation, and vector storage
- **Storage Costs**: Avoid storing duplicate embeddings and chunks in vector databases
- **API Costs**: Prevent redundant calls to LLM APIs for the same content

### 2. **Performance Benefits**
- **Faster Response Times**: Skip re-processing and return cached results immediately
- **Reduced Load**: Less computational overhead on processing infrastructure
- **Better User Experience**: Instant feedback for duplicate uploads

### 3. **Data Consistency**
- **Single Source of Truth**: Ensure identical files have the same processing results
- **Version Control**: Track when files were first processed and by whom
- **Audit Trail**: Maintain complete history of file interactions

### 4. **Resource Optimization**
- **Memory Usage**: Avoid loading and processing the same large files multiple times
- **Bandwidth**: Reduce network traffic for file transfers
- **Storage Space**: Prevent duplicate file storage in blob storage systems

## 🔮 Advanced Features & Extensions

### 1. Near-Duplicate Detection

For detecting similar (but not identical) files, consider these approaches:

#### SimHash
```typescript
// Pseudo-code for SimHash implementation
import { simhash } from 'simhash-js';

export function computeSimHash(content: string): string {
  return simhash(content, { kshingles: 3, maxFeatures: 128 });
}

export function compareSimHashes(hash1: string, hash2: string): number {
  // Hamming distance between hashes
  const distance = hammingDistance(hash1, hash2);
  return (64 - distance) / 64; // Similarity score 0-1
}
```

#### MinHash (Jaccard Similarity)
```typescript
// Pseudo-code for MinHash implementation
export class MinHasher {
  private hashFunctions: Array<(x: string) => number>;
  
  constructor(numHashes: number = 128) {
    this.hashFunctions = generateHashFunctions(numHashes);
  }
  
  computeMinHash(shingles: Set<string>): number[] {
    return this.hashFunctions.map(hashFunc => 
      Math.min(...Array.from(shingles).map(hashFunc))
    );
  }
}
```

#### Content-Based Embedding Similarity
```typescript
// Using OpenAI embeddings for semantic similarity
export async function computeContentSimilarity(
  content1: string, 
  content2: string
): Promise<number> {
  const [embedding1, embedding2] = await Promise.all([
    openai.embeddings.create({ input: content1, model: 'text-embedding-3-small' }),
    openai.embeddings.create({ input: content2, model: 'text-embedding-3-small' })
  ]);
  
  return cosineSimilarity(embedding1.data[0].embedding, embedding2.data[0].embedding);
}
```

### 2. Caching Strategies

#### Redis Integration
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheLayer {
  // Cache hash lookups for faster duplicate detection
  async getFileByHash(hash: string): Promise<FileRecord | null> {
    const cached = await redis.get(`file:hash:${hash}`);
    if (cached) return JSON.parse(cached);
    
    const file = await db.findByHash(hash);
    if (file) {
      await redis.setex(`file:hash:${hash}`, 3600, JSON.stringify(file));
    }
    return file;
  }
  
  // Cache processing results
  async cacheProcessingResult(fileId: string, result: ProcessingResult): Promise<void> {
    await redis.setex(`processing:${fileId}`, 86400, JSON.stringify(result));
  }
}
```

#### Bloom Filters for Fast Negative Lookups
```typescript
import { BloomFilter } from 'bloom-filters';

export class HashBloomFilter {
  private filter: BloomFilter;
  
  constructor() {
    // Configure for expected number of items and false positive rate
    this.filter = new BloomFilter(10000, 4); // 10k items, ~1.5% false positive rate
  }
  
  addHash(hash: string): void {
    this.filter.add(hash);
  }
  
  mightContain(hash: string): boolean {
    return this.filter.has(hash);
  }
}
```

### 3. Microservice Architecture

#### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/dedup
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dedup
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: file-dedup-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: file-dedup
  template:
    metadata:
      labels:
        app: file-dedup
    spec:
      containers:
      - name: app
        image: file-dedup:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 📊 Monitoring & Observability

### Metrics to Track
- **Duplicate Detection Rate**: Percentage of uploads that are duplicates
- **Processing Times**: Time taken for hashing and RAG processing
- **Cache Hit Rates**: Effectiveness of caching strategies
- **Database Performance**: Query execution times and connection pool usage
- **Error Rates**: Failed uploads, processing errors, and timeouts

### Example Metrics Implementation
```typescript
import { createPrometheusMetrics } from 'prom-client';

export const metrics = {
  duplicateDetections: new Counter({
    name: 'file_duplicate_detections_total',
    help: 'Total number of duplicate files detected'
  }),
  
  processingDuration: new Histogram({
    name: 'file_processing_duration_seconds',
    help: 'Time taken to process files',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  cacheHits: new Counter({
    name: 'cache_hits_total',
    help: 'Number of cache hits',
    labelNames: ['cache_type']
  })
};
```

## 🔒 Security Considerations

1. **File Validation**: Implement strict file type and size validation
2. **Rate Limiting**: Prevent abuse with request rate limiting
3. **Authentication**: Add API key or JWT-based authentication
4. **Encryption**: Encrypt sensitive file metadata at rest
5. **Access Control**: Implement role-based access to files and operations

## 📈 Scaling Considerations

1. **Horizontal Scaling**: Run multiple instances behind a load balancer
2. **Database Sharding**: Partition files table by hash prefix for very large datasets
3. **Async Processing**: Use message queues (Redis/RabbitMQ) for background processing
4. **CDN Integration**: Cache frequently accessed files and metadata
5. **Read Replicas**: Use database read replicas for query-heavy workloads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
