# System Architecture Diagrams

This document contains visual representations of the file de-duplication system architecture.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Interface]
        API_CLIENT[API Clients]
        MOBILE[Mobile Apps]
    end
    
    subgraph "Load Balancer"
        LB[NGINX/HAProxy]
    end
    
    subgraph "API Gateway"
        GATEWAY[API Gateway]
        AUTH[Authentication]
        RATE[Rate Limiting]
    end
    
    subgraph "Application Services"
        UPLOAD[Upload Service]
        CHECK[Duplicate Check]
        STATS[Statistics API]
        FILES[File Management]
    end
    
    subgraph "Processing Layer"
        HASHER[SHA-256 Engine]
        VALIDATOR[File Validator]
        QUEUE[Background Queue]
    end
    
    subgraph "Data Layer"
        PRIMARY[(PostgreSQL Primary)]
        REPLICA[(PostgreSQL Replica)]
        CACHE[(Redis Cache)]
        STORAGE[(File Storage)]
    end
    
    subgraph "RAG Pipeline"
        RAG_PROC[RAG Processor]
        VECTOR[(Vector DB)]
        EMBEDDING[Embedding Service]
    end
    
    subgraph "Monitoring"
        METRICS[Prometheus]
        ALERTS[Alertmanager]
        LOGS[Log Aggregation]
        DASHBOARD[Grafana]
    end
    
    WEB --> LB
    API_CLIENT --> LB
    MOBILE --> LB
    
    LB --> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> RATE
    
    GATEWAY --> UPLOAD
    GATEWAY --> CHECK
    GATEWAY --> STATS
    GATEWAY --> FILES
    
    UPLOAD --> HASHER
    UPLOAD --> VALIDATOR
    UPLOAD --> QUEUE
    
    CHECK --> CACHE
    CHECK --> PRIMARY
    
    HASHER --> PRIMARY
    VALIDATOR --> PRIMARY
    QUEUE --> RAG_PROC
    
    RAG_PROC --> VECTOR
    RAG_PROC --> EMBEDDING
    
    PRIMARY --> REPLICA
    PRIMARY --> CACHE
    
    UPLOAD --> METRICS
    CHECK --> METRICS
    STATS --> METRICS
    
    METRICS --> ALERTS
    METRICS --> DASHBOARD
    
    style UPLOAD fill:#e1f5fe
    style HASHER fill:#f3e5f5
    style PRIMARY fill:#e8f5e8
    style CACHE fill:#fff3e0
    style RAG_PROC fill:#fce4ec
```

## Duplicate Detection Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Hasher
    participant Cache
    participant Database
    participant Queue
    participant RAG

    User->>WebApp: Upload File
    WebApp->>API: POST /api/upload
    
    API->>Hasher: Compute SHA-256
    Note over Hasher: Stream-based processing<br/>Memory efficient
    Hasher-->>API: Return hash
    
    API->>Cache: Check hash in cache
    alt Cache Hit
        Cache-->>API: Return cached result
        API-->>WebApp: Immediate response
    else Cache Miss
        API->>Database: Query by hash
        alt Hash Exists (Duplicate)
            Database-->>API: Return existing record
            API->>Cache: Update cache
            API-->>WebApp: Duplicate detected
        else Hash Not Found (New File)
            API->>Database: Insert new record
            API->>Cache: Cache new record
            API->>Queue: Queue for processing
            API-->>WebApp: Upload successful
            
            Queue->>RAG: Process file
            Note over RAG: Text extraction<br/>Embedding generation<br/>Vector storage
            RAG->>Database: Update status
        end
    end
    
    WebApp-->>User: Show result
```

## Database Schema Design

```mermaid
erDiagram
    FILES {
        uuid id PK
        varchar file_name
        char file_hash UK "SHA-256 Hash"
        bigint file_size
        varchar mime_type
        integer chunk_count
        varchar processing_status
        timestamp created_at
        timestamp updated_at
    }
    
    PROCESSING_LOG {
        uuid id PK
        uuid file_id FK
        varchar status
        text error_message
        timestamp created_at
    }
    
    CACHE_STATS {
        varchar hash_prefix PK
        integer hit_count
        integer miss_count
        timestamp last_accessed
    }
    
    FILES ||--o{ PROCESSING_LOG : has
    FILES ||--o{ CACHE_STATS : indexed_by
```

## Microservice Architecture

```mermaid
graph TB
    subgraph "Frontend Services"
        UI[React UI Service]
        CDN[CDN/Static Assets]
    end
    
    subgraph "API Services"
        GATEWAY[API Gateway]
        AUTH_SVC[Auth Service]
        UPLOAD_SVC[Upload Service]
        DEDUP_SVC[Deduplication Service]
        FILE_SVC[File Management]
        STATS_SVC[Statistics Service]
    end
    
    subgraph "Processing Services"
        HASH_SVC[Hash Computing Service]
        VALID_SVC[Validation Service]
        QUEUE_SVC[Queue Service]
        RAG_SVC[RAG Processing Service]
    end
    
    subgraph "Data Services"
        DB_PRIMARY[(Primary Database)]
        DB_REPLICA[(Read Replica)]
        REDIS[(Redis Cluster)]
        BLOB[(Blob Storage)]
        VECTOR_DB[(Vector Database)]
    end
    
    subgraph "Infrastructure Services"
        MONITOR[Monitoring]
        LOG[Logging]
        CONFIG[Configuration]
        SECRET[Secret Management]
    end
    
    UI --> GATEWAY
    GATEWAY --> AUTH_SVC
    GATEWAY --> UPLOAD_SVC
    GATEWAY --> DEDUP_SVC
    GATEWAY --> FILE_SVC
    GATEWAY --> STATS_SVC
    
    UPLOAD_SVC --> HASH_SVC
    UPLOAD_SVC --> VALID_SVC
    UPLOAD_SVC --> QUEUE_SVC
    
    DEDUP_SVC --> REDIS
    DEDUP_SVC --> DB_REPLICA
    
    HASH_SVC --> DB_PRIMARY
    QUEUE_SVC --> RAG_SVC
    RAG_SVC --> VECTOR_DB
    
    FILE_SVC --> BLOB
    STATS_SVC --> DB_REPLICA
    
    style UPLOAD_SVC fill:#e1f5fe
    style DEDUP_SVC fill:#f3e5f5
    style HASH_SVC fill:#fff3e0
    style RAG_SVC fill:#fce4ec
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer Tier"
            ALB[Application Load Balancer]
            WAF[Web Application Firewall]
        end
        
        subgraph "Application Tier (Auto Scaling)"
            APP1[App Instance 1]
            APP2[App Instance 2]
            APP3[App Instance 3]
            APPN[App Instance N]
        end
        
        subgraph "Data Tier"
            RDS_MASTER[(RDS PostgreSQL Master)]
            RDS_REPLICA[(RDS PostgreSQL Replica)]
            REDIS_CLUSTER[(Redis Cluster)]
            S3[(S3 Bucket)]
        end
        
        subgraph "Monitoring & Logging"
            CLOUDWATCH[CloudWatch]
            PROMETHEUS[Prometheus]
            GRAFANA[Grafana]
            ELK[ELK Stack]
        end
    end
    
    subgraph "Development Environment"
        DEV_APP[Dev Instance]
        DEV_DB[(Dev Database)]
        DEV_CACHE[(Dev Redis)]
    end
    
    subgraph "CI/CD Pipeline"
        GITHUB[GitHub Repository]
        ACTIONS[GitHub Actions]
        DOCKER[Docker Registry]
        DEPLOY[Deployment Pipeline]
    end
    
    WAF --> ALB
    ALB --> APP1
    ALB --> APP2
    ALB --> APP3
    ALB --> APPN
    
    APP1 --> RDS_MASTER
    APP2 --> RDS_REPLICA
    APP3 --> REDIS_CLUSTER
    APPN --> S3
    
    RDS_MASTER --> RDS_REPLICA
    
    APP1 --> CLOUDWATCH
    APP2 --> PROMETHEUS
    APP3 --> ELK
    
    GITHUB --> ACTIONS
    ACTIONS --> DOCKER
    DOCKER --> DEPLOY
    DEPLOY --> APP1
    
    style ALB fill:#ff9999
    style APP1 fill:#99ccff
    style RDS_MASTER fill:#99ff99
    style REDIS_CLUSTER fill:#ffcc99
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Perimeter"
        subgraph "Network Security"
            VPC[Virtual Private Cloud]
            SG[Security Groups]
            NACL[Network ACLs]
            BASTION[Bastion Host]
        end
        
        subgraph "Application Security"
            TLS[TLS/SSL Termination]
            JWT[JWT Authentication]
            RBAC[Role-Based Access]
            RATE_LIMIT[Rate Limiting]
        end
        
        subgraph "Data Security"
            ENCRYPT_REST[Encryption at Rest]
            ENCRYPT_TRANSIT[Encryption in Transit]
            KEY_MGMT[Key Management]
            BACKUP[Encrypted Backups]
        end
        
        subgraph "Monitoring Security"
            AUDIT[Audit Logging]
            SIEM[Security Monitoring]
            ALERT[Security Alerts]
            INCIDENT[Incident Response]
        end
    end
    
    subgraph "External Threats"
        DDOS[DDoS Attacks]
        INJECTION[SQL Injection]
        XSS[Cross-Site Scripting]
        MITM[Man-in-the-Middle]
    end
    
    DDOS -.->|Blocked by| WAF
    INJECTION -.->|Prevented by| RBAC
    XSS -.->|Mitigated by| TLS
    MITM -.->|Protected by| ENCRYPT_TRANSIT
    
    style VPC fill:#ffeeee
    style TLS fill:#eeffee
    style ENCRYPT_REST fill:#eeeeff
    style AUDIT fill:#ffffee
```

## Scaling Strategy

```mermaid
graph LR
    subgraph "Scaling Dimensions"
        subgraph "Horizontal Scaling"
            H1[Load Balancer]
            H2[Multiple App Instances]
            H3[Database Read Replicas]
            H4[Cache Clustering]
        end
        
        subgraph "Vertical Scaling"
            V1[CPU Scaling]
            V2[Memory Scaling]
            V3[Storage Scaling]
            V4[Network Scaling]
        end
        
        subgraph "Geographic Scaling"
            G1[Multi-Region Deployment]
            G2[CDN Distribution]
            G3[Edge Computing]
            G4[Data Replication]
        end
    end
    
    subgraph "Auto Scaling Triggers"
        CPU_UTIL[CPU > 70%]
        MEM_UTIL[Memory > 80%]
        REQ_RATE[Requests > 1000/min]
        QUEUE_LEN[Queue Length > 100]
    end
    
    CPU_UTIL --> H2
    MEM_UTIL --> V2
    REQ_RATE --> H1
    QUEUE_LEN --> H2
    
    style H2 fill:#e1f5fe
    style V2 fill:#f3e5f5
    style G1 fill:#e8f5e8
```

## Performance Monitoring Dashboard

```mermaid
graph TB
    subgraph "Real-time Metrics"
        subgraph "Application Metrics"
            RPS[Requests/Second]
            LATENCY[Response Latency]
            ERROR_RATE[Error Rate]
            THROUGHPUT[Throughput]
        end
        
        subgraph "System Metrics"
            CPU[CPU Usage]
            MEMORY[Memory Usage]
            DISK[Disk I/O]
            NETWORK[Network I/O]
        end
        
        subgraph "Business Metrics"
            UPLOADS[File Uploads]
            DUPLICATES[Duplicates Found]
            SAVINGS[Cost Savings]
            USERS[Active Users]
        end
    end
    
    subgraph "Alerting Thresholds"
        RED_ALERT[Critical: > 95th percentile]
        YELLOW_ALERT[Warning: > 90th percentile]
        GREEN_STATUS[Normal: < 90th percentile]
    end
    
    subgraph "Alert Channels"
        EMAIL[Email Alerts]
        SLACK[Slack Notifications]
        PAGER[PagerDuty]
        SMS[SMS Alerts]
    end
    
    RPS --> RED_ALERT
    LATENCY --> YELLOW_ALERT
    ERROR_RATE --> RED_ALERT
    
    RED_ALERT --> PAGER
    YELLOW_ALERT --> SLACK
    GREEN_STATUS --> EMAIL
    
    style RED_ALERT fill:#ffcccc
    style YELLOW_ALERT fill:#ffffcc
    style GREEN_STATUS fill:#ccffcc
```
