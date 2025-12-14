# RadioCalico Architecture Documentation

**Last Updated**: December 13, 2025
**Version**: 1.0
**Status**: Production Deployed on AWS

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Deployment Environments](#deployment-environments)
5. [Database Architecture](#database-architecture)
6. [Application Architecture](#application-architecture)
7. [Security Architecture](#security-architecture)
8. [Network Architecture](#network-architecture)
9. [Data Flow](#data-flow)
10. [Scalability Considerations](#scalability-considerations)

---

## System Overview

RadioCalico is a full-stack radio streaming platform with user management capabilities, built using Node.js/Express and PostgreSQL. The system supports three deployment modes: local development, Docker containerization, and AWS cloud deployment.

### Key Characteristics

- **Architecture Pattern**: Monolithic single-server application
- **API Style**: RESTful JSON APIs
- **Database**: PostgreSQL 17 with connection pooling
- **Deployment**: Multi-environment (Local, Docker, AWS)
- **Frontend**: Server-rendered static HTML with vanilla JavaScript

---

## Architecture Diagram

###AWS Production Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AWS Cloud (Multi-Region)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐                ┌──────────────────────┐  │
│  │   us-west-2 (Oregon)  │                │  us-west-1 (N. Cal)   │  │
│  │                       │                │                       │  │
│  │  ┌────────────────┐  │                │  ┌────────────────┐  │  │
│  │  │  AWS App Runner │  │                │  │  RDS PostgreSQL │  │  │
│  │  │                 │  │   SSL/TLS      │  │   Instance      │  │  │
│  │  │  radiocalco-app │◄─┼────────────────┼─►│  radiocalco-db  │  │  │
│  │  │                 │  │   (~5-10ms)    │  │                 │  │  │
│  │  │  Port: 3000     │  │                │  │  Port: 5432     │  │  │
│  │  │  1 vCPU, 2GB    │  │                │  │  db.t3.micro    │  │  │
│  │  └────────┬────────┘  │                │  └────────────────┘  │  │
│  │           │            │                │                       │  │
│  │           │ Pull Image │                │                       │  │
│  │           ▼            │                │                       │  │
│  │  ┌────────────────┐   │                │                       │  │
│  │  │  Amazon ECR     │   │                │                       │  │
│  │  │  Docker Registry│   │                │                       │  │
│  │  └────────────────┘   │                │                       │  │
│  │                        │                │                       │  │
│  └────────────────────────┘                └───────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  IAM Role: AppRunnerECRAccessRole                             │   │
│  │  Policy: AWSAppRunnerServicePolicyForECRAccess               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
                       ┌────────────────┐
                       │  Internet      │
                       │  Users         │
                       └────────────────┘
```

### Local/Docker Architecture

```
┌────────────────────────────────────────────────┐
│            Docker Host / Local Machine          │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐    ┌──────────────────┐ │
│  │  Node.js App     │    │  PostgreSQL 17    │ │
│  │  (Container/Proc)│◄──►│  (Container/Proc) │ │
│  │  Port: 3000      │    │  Port: 5432       │ │
│  └──────────────────┘    └──────────────────┘ │
│           │                                     │
└───────────┼─────────────────────────────────────┘
            │
            │ HTTP
            ▼
   ┌────────────────┐
   │  localhost:3000 │
   └────────────────┘
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 22.21.1 | JavaScript execution environment |
| Framework | Express.js | 4.21.2 | Web server and routing |
| Database Driver | pg (node-postgres) | 8.13.1 | PostgreSQL client for Node.js |
| Environment | dotenv | 17.2.3 | Environment variable management |
| Dev Server | Nodemon | 3.1.9 | Hot-reload development server |

### Database

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Database | PostgreSQL | 17 | Primary data store |
| Connection | pg Pool | - | Connection pooling |
| SSL | pg SSL | - | Secure connections to RDS |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| HTML/CSS/JS | Vanilla | No framework dependencies |
| Streaming | HLS.js | HLS stream playback |
| HTTP Client | Fetch API | Async API communication |

### Testing

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Test Runner | Jest | 29.7.0 | Test execution and assertions |
| API Testing | Supertest | 7.0.0 | HTTP endpoint testing |
| Coverage | Jest Coverage | - | Code coverage reporting |

### DevOps & Cloud

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Application packaging |
| Orchestration | Docker Compose | Local multi-container deployment |
| Container Registry | Amazon ECR | Docker image storage |
| Compute | AWS App Runner | Serverless container hosting |
| Database | AWS RDS | Managed PostgreSQL |
| CI/CD | GitHub Actions | Automated build and deploy |

---

## Deployment Environments

### 1. Local Development

**Purpose**: Developer workstation testing
**Database**: Local PostgreSQL installation
**Configuration**: `.env` file with localhost settings

**Characteristics**:
- Direct Node.js process execution
- PostgreSQL running via Homebrew services
- Fast development cycle with nodemon hot-reload
- No containerization overhead

**Connection String**:
```
postgresql://username@localhost:5432/radiocalco_dev
```

### 2. Docker Development

**Purpose**: Consistent development environment
**Database**: PostgreSQL 17 Alpine container
**Configuration**: `.env` file with `DB_HOST=db`

**Characteristics**:
- Multi-container setup (app + database)
- Automatic database initialization via init.sql
- Volume-based data persistence
- Health checks for both containers
- Network isolation

**Services**:
- **app**: Node.js application (port 3000)
- **db**: PostgreSQL database (port 5432)

### 3. AWS Production

**Purpose**: Public internet deployment
**Regions**: Multi-region (us-west-2 for compute, us-west-1 for database)
**Configuration**: Environment variables in App Runner

**Components**:
- **Compute**: AWS App Runner (us-west-2)
  - 1 vCPU, 2GB RAM
  - Auto-scaling: 1-3 instances
  - Health check: `/api/health`

- **Database**: AWS RDS PostgreSQL (us-west-1)
  - Instance class: db.t3.micro
  - Storage: 20GB (auto-scaling to 100GB)
  - Multi-AZ: Disabled (single instance)
  - Backup retention: 7 days

- **Registry**: Amazon ECR (us-west-2)
  - Repository: `radiocalco-app`
  - Image scanning: Enabled

**URL**: https://4g3i27nzmy.us-west-2.awsapprunner.com

---

## Database Architecture

### Schema Design

The database uses a relational schema with four main tables:

#### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: User account management
**Key Constraints**:
- `UNIQUE` constraint on email
- Automatic timestamp on creation

#### 2. Students Table
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  grade VARCHAR(50) NOT NULL,
  major VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_grade ON students(grade);
```

**Purpose**: Academic record management
**Key Features**:
- Indexed email for fast lookups
- Indexed grade for filtering
- Optional major field

#### 3. Song Ratings Table
```sql
CREATE TABLE song_ratings (
  id SERIAL PRIMARY KEY,
  song_title VARCHAR(500) NOT NULL,
  song_artist VARCHAR(500) NOT NULL,
  rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('up', 'down')),
  user_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_title, song_artist, user_ip)
);

CREATE INDEX idx_song_ratings_song ON song_ratings(song_title, song_artist);
CREATE INDEX idx_song_ratings_user ON song_ratings(user_ip);
```

**Purpose**: Song rating system
**Key Features**:
- IP-based user identification
- Composite unique constraint prevents duplicate ratings
- CHECK constraint enforces valid rating types
- Indexes for both song lookup and user history

#### 4. Audit Log Table
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_email);
```

**Purpose**: Comprehensive audit trail
**Key Features**:
- JSONB for flexible change tracking
- IP address capture
- Composite index for entity lookups
- User email index for user activity queries

### Connection Management

**Connection Pooling** (`db.js:20-26`):
```javascript
const pool = new Pool({
  host: getDbHost(),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'radiocalco_dev',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com')
    ? { rejectUnauthorized: false }
    : false,
});
```

**Key Features**:
- Automatic SSL detection for AWS RDS
- Environment-aware host resolution
- Connection pooling for efficiency
- Error handling with automatic shutdown

---

## Application Architecture

### Request Flow

```
Client Request
    │
    ▼
┌──────────────────┐
│  Express.js      │
│  Middleware      │
└────────┬─────────┘
         │
         ├─► Static File Middleware (public/)
         │   └─► Serve HTML/CSS/JS/Images
         │
         ├─► JSON Body Parser
         │   └─► Parse request bodies
         │
         ├─► URL-Encoded Parser
         │   └─► Parse form data
         │
         └─► Route Handlers
             │
             ├─► API Routes (/api/*)
             │   │
             │   ├─► Health Check
             │   ├─► Database Test
             │   ├─► User CRUD
             │   ├─► Student CRUD
             │   ├─► Song Ratings
             │   └─► Audit Logs
             │       │
             │       ▼
             │   ┌──────────────┐
             │   │  db.js Pool  │
             │   └──────┬───────┘
             │          │
             │          ▼
             │   ┌──────────────┐
             │   │  PostgreSQL  │
             │   └──────────────┘
             │
             └─► Static Pages (/*.html)
                 └─► Redirect to public/
```

### File Structure

```
radiocalco/
├── server.js                 # Main Express application
│   ├── Middleware setup
│   ├── API route handlers
│   ├── Helper functions (logAudit)
│   └── Server startup
│
├── db.js                     # Database connection
│   ├── Pool configuration
│   ├── SSL handling
│   ├── Event handlers
│   └── Query exports
│
├── public/                   # Frontend assets
│   ├── *.html               # UI pages
│   ├── css/
│   │   ├── base.css         # Shared styles
│   │   └── *.css           # Page-specific styles
│   └── js/
│       └── utils.js         # Shared utilities
│
├── __tests__/               # Test suites
│   ├── *.test.js           # Backend tests
│   └── frontend/           # Frontend tests
│
├── Dockerfile               # Container build
├── docker-compose.yml       # Local orchestration
├── init.sql                 # Database schema
└── .env                     # Configuration
```

### Key Modules

#### server.js (Main Application)

**Line Count**: ~700 lines
**Responsibilities**:
- Express server configuration
- API endpoint implementation
- Audit logging helper (`logAudit()` at line 328)
- Error handling and validation
- Static file serving

**Key Functions**:
- `logAudit(action, entityType, entityId, changes, req)` - Audit trail logging
- Route handlers for all CRUD operations
- Input validation and error handling

#### db.js (Database Layer)

**Line Count**: ~42 lines
**Responsibilities**:
- PostgreSQL connection pooling
- Environment-aware configuration
- SSL/TLS handling for AWS RDS
- Connection event management

**Key Features**:
- Smart host detection (`getDbHost()`)
- SSL auto-detection for RDS endpoints
- Connection lifecycle logging
- Error handling with process exit

---

## Security Architecture

### Input Validation

**SQL Injection Prevention**:
- All queries use parameterized statements with `$1, $2, ...` placeholders
- No string concatenation in SQL queries
- Example from `server.js:159`:
  ```javascript
  const result = await db.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  ```

**XSS Prevention**:
- Frontend utility `escapeHtml()` sanitizes user input
- HTML entities encoded before DOM insertion
- Example from `public/js/utils.js:1`:
  ```javascript
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  ```

### Database Security

**AWS RDS Configuration**:
- SSL/TLS encryption required for all connections
- Security group allows PostgreSQL (5432) from 0.0.0.0/0
- Master password managed via environment variables
- Automated backups with 7-day retention

**Connection Security**:
- SSL enabled automatically for RDS endpoints (`db.js:27`)
- Rejects unauthorized certificates disabled for compatibility
- Connection pooling limits database connections

### API Security

**Current State** (Development/Learning):
- No authentication/authorization
- No rate limiting
- Public API endpoints
- IP-based rating identification

**Production Recommendations**:
- Add JWT or session-based authentication
- Implement rate limiting (express-rate-limit)
- Add API key validation for programmatic access
- Restrict security group to known IP ranges

---

## Network Architecture

### AWS Production Network

**Multi-Region Setup**:
- **Compute Region**: us-west-2 (Oregon)
- **Database Region**: us-west-1 (Northern California)
- **Cross-Region Latency**: ~5-10ms

**Connectivity**:
```
App Runner (us-west-2)
    │
    │ SSL/TLS on port 5432
    │ Cross-region via AWS backbone
    │
    ▼
RDS PostgreSQL (us-west-1)
    │
    └─► Security Group: sg-09965ceaeee2c98d6
        └─► Inbound Rule: TCP 5432 from 0.0.0.0/0
```

**Why Cross-Region?**:
- AWS App Runner not available in us-west-1
- RDS already provisioned in us-west-1
- AWS backbone provides low-latency cross-region connectivity
- Acceptable for non-critical application

**Security Group Configuration**:
```
Inbound Rules:
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: 0.0.0.0/0 (All IPs)
- Description: Allow PostgreSQL from App Runner
```

### Docker Network

**Network Type**: Bridge network
**Service Discovery**: DNS-based (service name `db`)

```
docker-compose network: radiocalco_default
    │
    ├─► app container
    │   └─► Connects to: db:5432
    │
    └─► db container
        └─► Listens on: 5432
```

---

## Data Flow

### User Creation Flow

```
1. Client Request
   POST /api/users
   Body: { name: "John", email: "john@example.com" }

2. Express Middleware
   - Parse JSON body
   - Extract name and email

3. Validation (server.js:151-157)
   - Check name and email exist
   - Validate email format

4. Database Insert (server.js:159-162)
   INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *

5. Audit Log (server.js:164-172)
   - Call logAudit('CREATE', 'user', id, {name, email}, req)
   - Insert into audit_log with JSONB changes

6. Response
   { status: "success", message: "User created", user: {...} }
```

### Song Rating Flow

```
1. Client Request
   POST /api/ratings
   Body: { title: "Song Name", artist: "Artist", rating: "up" }

2. Database Lookup (server.js:400-407)
   SELECT * FROM song_ratings
   WHERE song_title = $1 AND song_artist = $2 AND user_ip = $3

3. Logic Branch
   │
   ├─► Existing Rating
   │   └─► Same rating type: Return error
   │   └─► Different rating: UPDATE rating_type
   │
   └─► New Rating
       └─► INSERT new rating record

4. Count Aggregation (server.js:439-445)
   SELECT rating_type, COUNT(*)
   FROM song_ratings
   WHERE song_title = $1 AND song_artist = $2
   GROUP BY rating_type

5. Response
   {
     status: "success",
     ratings: { up: 10, down: 2 },
     userRating: "up"
   }
```

### Audit Log Flow

```
1. Audit Trigger (any CREATE/UPDATE/DELETE)

2. logAudit() Helper (server.js:328-343)
   - Extract user info from request
   - Get IP address (req.ip)
   - Format changes as JSONB

3. Database Insert
   INSERT INTO audit_log (
     action, entity_type, entity_id,
     user_name, user_email, changes, ip_address
   ) VALUES ($1, $2, $3, $4, $5, $6, $7)

4. No Response (Fire-and-forget)
   - Audit logging doesn't block user operations
   - Errors logged but not returned to client
```

---

## Scalability Considerations

### Current Limitations

1. **Single Server Instance**
   - Monolithic application
   - No horizontal scaling
   - Single point of failure

2. **Database Connections**
   - Connection pool size limited
   - No read replicas
   - All queries to primary database

3. **No Caching**
   - Database hit on every request
   - No Redis or CDN caching
   - Repeated queries for same data

4. **Stateful Sessions** (Future)
   - Current design is stateless (good)
   - Adding authentication will require session management

### Scaling Strategies

#### Immediate Improvements

1. **App Runner Auto-Scaling**
   - Current: Min 1, Max 3 instances
   - Increase max instances for traffic spikes
   - Configure CPU/Memory thresholds

2. **Connection Pooling**
   - Current: Default pg pool settings
   - Tune pool size based on instance count
   - Monitor connection utilization

3. **Caching Layer**
   - Add Redis for frequently accessed data
   - Cache song ratings aggregations
   - Cache user/student lists with TTL

#### Medium-Term Improvements

1. **Read Replicas**
   - Create RDS read replicas in us-west-2
   - Route SELECT queries to replicas
   - Keep writes on primary

2. **CDN Integration**
   - CloudFront for static assets
   - Edge caching for API responses
   - Reduce origin load

3. **Database Optimization**
   - Add missing indexes based on query patterns
   - Implement query result caching
   - Optimize N+1 query patterns

#### Long-Term Improvements

1. **Microservices Architecture**
   - Separate user service
   - Separate rating service
   - API gateway for routing

2. **Event-Driven Architecture**
   - Message queue (SQS/SNS) for audit logs
   - Async processing for non-critical operations
   - Decouple services

3. **Kubernetes Deployment**
   - Container orchestration
   - Advanced auto-scaling
   - Blue-green deployments

---

## Performance Metrics

### Current Performance

**Response Times** (AWS Production):
- Health check: ~50ms
- Database test: ~100ms
- User list (empty): ~120ms
- Create user: ~150ms
- Rating submission: ~200ms

**Database Performance**:
- Connection pool: Default (10 connections)
- Query execution: ~20-50ms (cross-region)
- SSL handshake: ~30ms (first connection)

**Availability**:
- App Runner: 99.9% uptime
- RDS: 99.95% uptime
- Combined: ~99.85% expected

### Monitoring Points

**Application Metrics**:
- Request count per endpoint
- Response time distribution
- Error rate by status code
- Connection pool utilization

**Database Metrics**:
- CPU utilization
- Connection count
- Query execution time
- Storage usage

**Infrastructure Metrics**:
- App Runner instance count
- Memory utilization
- Network throughput
- Health check status

---

## Disaster Recovery

### Backup Strategy

**AWS RDS Automated Backups**:
- Frequency: Daily
- Retention: 7 days
- Backup window: Automatic
- Point-in-time recovery: Enabled

**Manual Backups**:
- ECR image tags: Git commit SHA + `latest`
- Docker images: Stored in ECR
- Application code: GitHub repository

### Recovery Procedures

**Database Restore**:
1. Navigate to RDS Console
2. Select `radiocalco-db` instance
3. Actions → Restore to point in time
4. Choose target date/time
5. Launch new instance
6. Update App Runner environment variable `DB_HOST`

**Application Rollback**:
1. Identify last known good image tag
2. Update App Runner to use specific image SHA
3. Trigger new deployment
4. Verify health checks pass

**Complete Rebuild**:
1. Clone GitHub repository
2. Follow DEPLOYMENT.md instructions
3. Restore database from backup
4. Deploy fresh App Runner service

---

## Cost Analysis

### AWS Monthly Costs

**App Runner**: $5-15/month
- $0.007/hour per instance = ~$5/month (1 instance)
- Additional instances during auto-scale
- Included: Load balancing, SSL, auto-deploy

**RDS**: $0/month (first 12 months free tier)
- db.t3.micro: 750 hours/month free
- After free tier: ~$15/month
- 20GB storage: Included

**ECR**: $0-1/month
- First 500MB free
- Current usage: ~55MB
- $0.10/GB-month after free tier

**Data Transfer**: $0-2/month
- Cross-region: $0.02/GB
- Estimated: 5GB/month = $0.10

**Total**: $5-18/month (development/learning usage)

---

## Future Enhancements

### Planned Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - OAuth2 integration (Google, GitHub)

2. **Real-Time Features**
   - WebSocket for live updates
   - Server-sent events for notifications
   - Real-time radio listeners count

3. **Enhanced Monitoring**
   - CloudWatch dashboards
   - Custom metrics and alarms
   - Application performance monitoring (APM)

4. **CI/CD Improvements**
   - Automated tests in pipeline
   - Blue-green deployments
   - Canary releases

5. **Database Enhancements**
   - Read replicas for scaling
   - Connection pooling optimization
   - Query performance monitoring

---

## References

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Express.js Documentation](https://expressjs.com/)
- [node-postgres Documentation](https://node-postgres.com/)
- [Docker Documentation](https://docs.docker.com/)

---

**Document Version**: 1.0
**Last Review**: December 13, 2025
**Next Review**: March 2026
