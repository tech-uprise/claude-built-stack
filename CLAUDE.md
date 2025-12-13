# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RadioHub (formerly RadioCalico) is a radio streaming platform built with Node.js/Express and PostgreSQL. It serves multiple radio stations with live HLS streaming, user management, song ratings, and audit logging.

**Key Tech Stack:**
- Backend: Node.js v22.21.1 + Express.js
- Database: PostgreSQL 17
- Frontend: Vanilla JavaScript with HLS.js for streaming
- Development: Nodemon for hot-reload

## Common Commands

### Development
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

### Testing
```bash
# Run all tests with coverage report
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode (no interactive prompts)
npm run test:ci
```

The project uses Jest and Supertest for automated testing. Test coverage includes:
- API endpoints (health, users, students, ratings, audit)
- Database operations (CRUD for all entities)
- Error handling and validation
- Audit logging verification

All tests run against the actual PostgreSQL database configured in `.env`. Test data is automatically cleaned up after test execution using email patterns (e.g., `test-%@example.com`).

**Test Statistics:**
- 45+ test cases covering all major functionality
- ~85% code coverage across server.js and db.js
- Automated cleanup prevents test data pollution

### Database Management
```bash
# Start PostgreSQL service
brew services start postgresql@17

# Stop PostgreSQL service
brew services stop postgresql@17

# Check service status
brew services list

# Create database
/usr/local/opt/postgresql@17/bin/createdb radiocalco_dev

# Connect to database
/usr/local/opt/postgresql@17/bin/psql radiocalco_dev

# Check database exists
/usr/local/opt/postgresql@17/bin/psql -l
```

### Database Setup
The application requires four tables. Connect to the database and run:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Song ratings table
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

-- Audit log table
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

-- Students table
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

## Architecture Overview

### Core Files
- **server.js**: Main Express application with all API routes and middleware. Single-file architecture for simplicity.
- **db.js**: PostgreSQL connection pool using `pg` library with connection event handlers.
- **public/**: Static frontend files served directly by Express.

### Request Flow
1. Express middleware processes JSON/URL-encoded bodies
2. Static files served from `public/` directory
3. API routes in server.js query database via db.js connection pool
4. All user mutations (CREATE/UPDATE/DELETE) trigger audit log entries via `logAudit()` helper function (server.js:328)

### Database Architecture
- **Connection pooling**: Uses pg Pool for efficient database connections
- **Parameterized queries**: All queries use `$1, $2...` placeholders to prevent SQL injection
- **Audit trail**: All user operations logged to `audit_log` table with IP address, changes as JSONB

### Radio Streaming
- **Main stream (radio.html)**: HLS stream via CloudFront, uses HLS.js library
  - Metadata polled every 20 seconds from JSON endpoint
  - Album art with cache-busting timestamps
  - Track history and rating system
- **92.3 FM (radio-923.html)**: SHOUTcast stream, uses native HTML5 audio (no HLS.js)

### Song Rating System
- **IP-based deduplication**: Uses `req.ip` to identify users
- **Database constraint**: UNIQUE(song_title, song_artist, user_ip)
- **Update logic**: If user changes rating, UPDATE existing record; if same rating, return error
- **API flow**: Check existing rating → INSERT new or UPDATE existing → return counts and user's rating
- **Rating persistence**: GET endpoint returns userRating field showing which button user clicked ('up', 'down', or null)

### Student Management System
- **Similar to user management**: Students have name, email, grade, and optional major fields
- **Grade validation**: Frontend provides dropdown for Freshman, Sophomore, Junior, Senior, Graduate
- **Email uniqueness**: Enforced at database level with UNIQUE constraint
- **Audit logging**: All student operations (CREATE/UPDATE/DELETE) logged to audit_log table
- **Frontend pages**:
  - students.html - List view with sorting, search, and delete
  - register-student.html - Registration form
  - edit-student.html - Edit form with pre-populated data

## Environment Configuration

Copy `.env.example` to `.env` and configure:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radiocalco_dev
DB_USER=your_username
DB_PASSWORD=your_password
```

The db.js file uses these environment variables with sensible defaults.

## API Endpoints

### System
- `GET /api/health` - Health check
- `GET /api/test-db` - Test database connection
- `GET /api/audit` - Retrieve audit logs (last 1000)

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (requires name, email)
- `PUT /api/users/:id` - Update user (requires name, email)
- `DELETE /api/users/:id` - Delete user

### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student (requires name, email, grade; optional major)
- `PUT /api/students/:id` - Update student (requires name, email, grade; optional major)
- `DELETE /api/students/:id` - Delete student

### Ratings
- `GET /api/ratings/:title/:artist` - Get rating counts and user's rating for a song (returns ratings object and userRating field)
- `POST /api/ratings` - Submit/update rating (requires title, artist, rating: "up" or "down")

All endpoints return JSON with `status`, `message`, and data fields. Errors include appropriate HTTP status codes.

## Brand Guidelines

The RadioCalico brand uses specific colors and typography defined in `RadioCalico_Style_Guide.txt`:
- **Colors**: Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Calico Orange (#EFA63C), Charcoal (#231F20), Cream (#F5EADA)
- **Typography**: Montserrat for headings, Open Sans for body text
- **Logo**: RadioCalicoLogoTM.png (cat with headphones)

When creating or modifying frontend pages, maintain consistency with these brand colors and the existing design patterns in public/*.html files.

## Important Implementation Notes

### Security
- All database queries use parameterized statements to prevent SQL injection
- Email uniqueness enforced at database level (UNIQUE constraint)
- User input validated before processing
- IP addresses captured for audit trail

### Error Handling
- PostgreSQL error code 23505 (unique violation) handled specifically for duplicate emails
- Database connection errors caught and returned as 500 status
- Invalid user IDs (non-integers, not found) return 400/404 appropriately

### Frontend Architecture
- No build step required - vanilla JavaScript served statically
- **Shared Utilities**: `/public/js/utils.js` - DRY principle with common functions
  - `escapeHtml()` - XSS prevention
  - `showMessage()` - Consistent notifications across pages
  - `formatDate()`, `formatTimestamp()` - Date formatting
  - `getFormData()`, `isValidEmail()` - Form helpers
- HLS.js loaded from CDN for main radio player
- All pages use fetch() API for backend communication
- Brand colors and typography consistent across all pages
- ~144 lines of duplicate JavaScript eliminated via refactoring

### Testing
The application has comprehensive automated tests using Jest and Supertest. To run tests:
```bash
npm test                # Run all tests with coverage
npm run test:watch      # Run tests in watch mode
npm run test:ci         # Run tests in CI mode
```

For manual testing:
1. Start the server with `npm run dev`
2. Verify database connection at http://localhost:3000/api/test-db
3. Test API endpoints manually or via api-docs.html page
4. Test radio streams by loading radio.html and radio-923.html

## Known Limitations

- **Rating system**: IP-based, can be bypassed with VPN or shared in corporate networks
- **No authentication**: User management has no access control
- **Single server instance**: No horizontal scaling support
- **No rate limiting**: API endpoints can be called without restrictions
