# Claude Built Stack

A full-stack web platform showcasing modern AI-assisted development with Claude Code, MCP, and AWS Bedrock. This project demonstrates rapid feature development, production-ready architecture, and end-to-end testing practices.

## 🎯 Project Purpose

This is a portfolio/learning project that showcases:
- **AI-Assisted Development**: Built collaboratively with Claude Code and MCP servers
- **Full-Stack Capabilities**: Complete CRUD operations, real-time streaming, audit logging
- **Modern Architecture**: RESTful APIs, connection pooling, responsive frontend
- **Production Practices**: Environment management, error handling, security patterns

## ✨ Features

### Radio Streaming Platform
- **Live HLS Streaming**: CloudFront-powered HLS streams with HLS.js player
- **SHOUTcast Support**: HTML5 audio player for 92.3 FM station
- **Real-time Metadata**: Polling-based song info updates with album art
- **Song Rating System**: IP-based rating with up/down votes and persistence
- **Track History**: Display recent songs with artist information

### User Management System
- **Full CRUD Operations**: Create, read, update, delete users
- **Email Uniqueness**: Database-level constraints with proper error handling
- **Audit Trail**: All operations logged with IP addresses and change tracking
- **RESTful API**: Clean JSON endpoints with proper status codes

### Student Registry
- **Academic Management**: Student records with name, email, grade, and major
- **Grade Validation**: Dropdown selection for academic levels
- **Search & Sort**: Frontend filtering and sorting capabilities
- **Integrated Audit**: All student operations tracked in audit log

### Audit Logging
- **Comprehensive Tracking**: All CREATE/UPDATE/DELETE operations logged
- **JSONB Storage**: Flexible change tracking with PostgreSQL JSONB
- **IP Tracking**: User identification via request IP addresses
- **Query Interface**: Retrieve and analyze audit logs via API

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v22.21.1
- **Framework**: Express.js
- **Database**: PostgreSQL 17 with pg connection pooling
- **Environment**: dotenv for configuration management

### Frontend
- **Vanilla JavaScript**: No framework dependencies for clarity
- **HLS.js**: Professional-grade HLS streaming library
- **Responsive Design**: Mobile-first CSS with RadioCalico branding
- **Fetch API**: Modern async HTTP requests

### Development Tools
- **AI Assistance**: Claude Code, MCP servers, AWS Bedrock
- **Dev Server**: Nodemon for hot-reload development
- **Version Control**: Git with GitHub
- **Database Client**: PostgreSQL CLI tools

## 📡 API Endpoints

### System Health
```
GET /api/health          - Health check with timestamp
GET /api/test-db         - Database connection test
GET /api/audit           - Retrieve audit logs (last 1000)
```

### User Management
```
GET    /api/users        - List all users
GET    /api/users/:id    - Get single user
POST   /api/users        - Create user (name, email)
PUT    /api/users/:id    - Update user (name, email)
DELETE /api/users/:id    - Delete user (logged)
```

### Student Management
```
GET    /api/students        - List all students
GET    /api/students/:id    - Get single student
POST   /api/students        - Create student (name, email, grade, major?)
PUT    /api/students/:id    - Update student (name, email, grade, major?)
DELETE /api/students/:id    - Delete student (logged)
```

### Song Ratings
```
GET  /api/ratings/:title/:artist  - Get rating counts + user's rating
POST /api/ratings                  - Submit/update rating (title, artist, rating: "up"|"down")
```

All endpoints return JSON with `status`, `message`, and `data` fields. Errors include appropriate HTTP status codes (400, 404, 500).

## 🚀 Getting Started

### Prerequisites
- Node.js v22.21.1 or later
- PostgreSQL 17
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tech-uprise/claude-built-stack.git
cd claude-built-stack
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Start PostgreSQL**
```bash
brew services start postgresql@17
```

5. **Create database**
```bash
/usr/local/opt/postgresql@17/bin/createdb radiocalco_dev
```

6. **Initialize database tables**
```bash
/usr/local/opt/postgresql@17/bin/psql radiocalco_dev
```

Then run the SQL from `CLAUDE.md` (users, song_ratings, audit_log, students tables).

7. **Start development server**
```bash
npm run dev
```

8. **Access the application**
- Main page: http://localhost:3000
- User management: http://localhost:3000/users.html
- Student registry: http://localhost:3000/students.html
- Radio player: http://localhost:3000/radio.html
- API docs: http://localhost:3000/api-docs.html

## 🏗️ Architecture

### Request Flow
1. Express middleware processes JSON/URL-encoded bodies
2. Static files served from `public/` directory
3. API routes query PostgreSQL via connection pool
4. All mutations trigger audit log entries
5. Frontend updates via fetch() API calls

### Database Design
- **Connection Pooling**: pg Pool for efficient connections
- **Parameterized Queries**: SQL injection prevention with `$1, $2...` placeholders
- **Constraints**: UNIQUE constraints on emails, UNIQUE(song, artist, ip) for ratings
- **Indexes**: Optimized queries on song_ratings, audit_log, students
- **JSONB**: Flexible change tracking in audit_log

### Security
- All queries use parameterized statements (no SQL injection)
- Email uniqueness enforced at database level
- Input validation before processing
- Error code 23505 (unique violation) handled specifically
- IP addresses captured for audit trail

### Frontend Architecture
- No build step required - vanilla JavaScript
- HLS.js loaded from CDN for streaming
- Consistent branding: Montserrat/Open Sans fonts, RadioCalico colors
- All pages use fetch() for async communication

## 📂 Project Structure

```
claude-built-stack/
├── server.js              # Main Express app with all routes
├── db.js                  # PostgreSQL connection pool
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment template
├── package.json           # Dependencies and scripts
├── CLAUDE.md              # Claude Code project instructions
├── public/                # Static frontend files
│   ├── index.html         # Landing page
│   ├── users.html         # User management UI
│   ├── students.html      # Student registry UI
│   ├── radio.html         # HLS radio player
│   ├── radio-923.html     # SHOUTcast player
│   ├── api-docs.html      # API documentation
│   ├── audit.html         # Audit log viewer
│   └── css/               # Stylesheets
└── README.md              # This file
```

## 🧪 Testing

Currently manual testing. To test the application:
1. Start server with `npm run dev`
2. Verify database at http://localhost:3000/api/test-db
3. Test API endpoints via api-docs.html
4. Test radio streams via radio.html and radio-923.html
5. Test CRUD operations via users.html and students.html

**Future**: End-to-end testing with Playwright/Cypress planned.

## 🎨 Brand Guidelines

The RadioCalico brand uses:
- **Colors**: Mint (#D8F2D5), Forest Green (#1F4E23), Teal (#38A29D), Calico Orange (#EFA63C), Charcoal (#231F20), Cream (#F5EADA)
- **Typography**: Montserrat (headings), Open Sans (body)
- **Logo**: RadioCalicoLogoTM.png (cat with headphones)

See `RadioCalico_Style_Guide.txt` for complete guidelines.

## 🤖 AI Development Process

This project leverages:
- **Claude Code**: AI pair programming for rapid feature development
- **MCP (Model Context Protocol)**: Enhanced context and tool integration
- **AWS Bedrock**: [Planned] AI model deployment and scaling
- **Iterative Development**: Human-AI collaboration for requirements → implementation → testing

### Key Learning Outcomes
- Effective AI-assisted full-stack development
- RESTful API design and implementation
- PostgreSQL schema design and optimization
- Modern JavaScript patterns (async/await, fetch)
- Production-ready error handling
- Database connection management
- Security best practices (SQL injection prevention, input validation)

## 📝 Available Scripts

```bash
npm start       # Production server
npm run dev     # Development server with auto-reload
```

## 🔧 Database Management

### Start/Stop PostgreSQL
```bash
brew services start postgresql@17
brew services stop postgresql@17
brew services list
```

### Access Database
```bash
/usr/local/opt/postgresql@17/bin/psql radiocalco_dev
```

### Common Commands
- `\l` - List databases
- `\dt` - List tables
- `\d table_name` - Describe table
- `\q` - Quit

## ⚠️ Known Limitations

- **No Authentication**: User/student endpoints lack access control
- **IP-Based Ratings**: Can be bypassed with VPN
- **No Rate Limiting**: API endpoints unrestricted
- **Manual Testing**: No automated test suite yet
- **Single Instance**: No horizontal scaling support

## 🚧 Roadmap

- [ ] Add authentication (JWT or session-based)
- [ ] Implement rate limiting
- [ ] Add end-to-end tests (Playwright)
- [ ] Add unit tests for API endpoints
- [ ] Implement WebSocket for real-time updates
- [ ] Add user roles and permissions
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 📄 License

This is a learning/portfolio project. Feel free to explore and learn from the code.

## 🤝 Contributing

This is a personal learning project, but feedback and suggestions are welcome via issues.

---

**Built with Claude Code** - Showcasing the future of AI-assisted software development.
