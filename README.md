# RadioHub - Radio Streaming Platform

A comprehensive radio streaming platform with multiple stations, user management, and live streaming capabilities built with Node.js/Express and PostgreSQL.

## Tech Stack

- **Web Server**: Node.js with Express.js
- **Database**: PostgreSQL 17
- **Environment Management**: dotenv

## Installation

The environment has been set up with the following components:

1. Node.js v22.21.1 with npm 11.7.0
2. Express.js web server
3. PostgreSQL 17 database
4. Database connection pool with pg library

## Project Structure

```
radiocalco/
├── server.js           # Main Express server
├── db.js              # Database connection configuration
├── .env               # Environment variables (not in git)
├── .env.example       # Example environment variables
├── package.json       # Project dependencies
├── public/            # Static files (HTML, CSS, JS, images)
└── README.md          # This file
```

## Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

This will start the server with nodemon, which automatically restarts when you make changes.

Or use the production mode:

```bash
npm start
```

### 2. Access the Application

Open your browser and navigate to:
- **Main Page**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Database Test**: http://localhost:3000/api/test-db

## Database Configuration

The PostgreSQL database is configured with:
- **Database Name**: radiocalco_dev
- **Host**: localhost
- **Port**: 5432
- **User**: vasulf

You can modify these settings in the `.env` file.

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-reload

## Database Management

### Access PostgreSQL CLI

```bash
/usr/local/opt/postgresql@17/bin/psql radiocalco_dev
```

### Common PostgreSQL Commands

- `\l` - List all databases
- `\dt` - List all tables in current database
- `\d table_name` - Describe a table
- `\q` - Quit psql

### Stop/Start PostgreSQL Service

```bash
# Stop PostgreSQL
brew services stop postgresql@17

# Start PostgreSQL
brew services start postgresql@17

# Check status
brew services list
```

## API Endpoints

### GET /
Returns a welcome page with server status and available endpoints.

### GET /api/health
Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-10T17:50:00.000Z"
}
```

### GET /api/test-db
Tests the database connection.

**Response:**
```json
{
  "status": "success",
  "message": "Database connection successful",
  "data": {
    "current_time": "2025-12-10T17:50:00.000Z"
  }
}
```

## Adding Static Files

Place your HTML, CSS, JavaScript, and image files in the `public/` directory. They will be automatically served by Express.

Example:
- `public/index.html` → http://localhost:3000/index.html
- `public/styles.css` → http://localhost:3000/styles.css
- `public/app.js` → http://localhost:3000/app.js

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=radiocalco_dev
DB_USER=your_username
DB_PASSWORD=your_password
```

## Next Steps

1. Create database tables for your application
2. Add API routes in `server.js`
3. Create frontend files in the `public/` directory
4. Build your prototype!
