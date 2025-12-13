const express = require('express');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Radiocalco - Enterprise Platform</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Navigation */
        .nav {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand {
          font-size: 1.5em;
          font-weight: 700;
          color: #667eea;
        }

        .nav-links {
          display: flex;
          gap: 20px;
        }

        .nav-link {
          text-decoration: none;
          color: #555;
          padding: 8px 16px;
          border-radius: 5px;
          transition: background 0.2s, color 0.2s;
          font-weight: 500;
        }

        .nav-link:hover {
          background: #f0f0f0;
          color: #667eea;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .hero {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-bottom: 25px;
          text-align: center;
        }

        .hero h1 {
          color: #333;
          font-size: 2.5em;
          margin-bottom: 15px;
        }

        .hero p {
          color: #666;
          font-size: 1.1em;
          margin-bottom: 10px;
        }

        .status {
          color: #28a745;
          font-weight: 600;
          font-size: 1.05em;
          margin: 10px 0;
        }

        .system-info {
          display: flex;
          gap: 30px;
          justify-content: center;
          margin-top: 25px;
          padding-top: 25px;
          border-top: 2px solid #f0f0f0;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .info-label {
          font-size: 0.85em;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 1.1em;
          color: #333;
          font-weight: 600;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }

        .card h2 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 1.5em;
        }

        .card p {
          color: #666;
          margin-bottom: 20px;
        }

        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .endpoints {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .endpoints h2 {
          color: #333;
          margin-bottom: 20px;
        }

        .endpoint {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        .endpoint strong {
          color: #667eea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Navigation -->
        <nav class="nav">
          <div class="nav-brand">Radiocalco</div>
          <div class="nav-links">
            <a href="/" class="nav-link active">Home</a>
            <a href="/users.html" class="nav-link">Register User</a>
            <a href="/view-users.html" class="nav-link">View Users</a>
          </div>
        </nav>

        <!-- Hero Section -->
        <div class="hero">
          <h1>Welcome to Radiocalco</h1>
          <p>Local Development Environment for Rapid Prototyping</p>
          <div style="margin-top: 20px;">
            <p class="status">✓ Server is running</p>
            <p class="status">✓ Database connection ready</p>
          </div>
          <div class="system-info">
            <div class="info-item">
              <span class="info-label">Web Server</span>
              <span class="info-value">Express.js (Node.js)</span>
            </div>
            <div class="info-item">
              <span class="info-label">Database</span>
              <span class="info-value">PostgreSQL 17</span>
            </div>
          </div>
        </div>

        <!-- Quick Links Cards -->
        <div class="cards">
          <div class="card">
            <h2>Register User</h2>
            <p>Add new users to the database with name and email</p>
            <a href="/users.html" class="btn">Go to Registration</a>
          </div>
          <div class="card">
            <h2>View Users</h2>
            <p>Browse all registered users and manage the list</p>
            <a href="/view-users.html" class="btn">View All Users</a>
          </div>
        </div>

        <!-- API Endpoints -->
        <div class="endpoints">
          <h2>Available API Endpoints</h2>
          <div class="endpoint">
            <strong>GET /api/health</strong> - Health check endpoint
          </div>
          <div class="endpoint">
            <strong>GET /api/test-db</strong> - Test database connection
          </div>
          <div class="endpoint">
            <strong>GET /api/users</strong> - Retrieve all users
          </div>
          <div class="endpoint">
            <strong>POST /api/users</strong> - Create a new user
          </div>
          <div class="endpoint">
            <strong>DELETE /api/users/:id</strong> - Delete a user
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time');
    res.json({
      status: 'success',
      message: 'Database connection successful',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    res.json({
      status: 'success',
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Audit logging helper function
async function logAudit(action, entityType, entityId, userName, userEmail, changes, req) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await db.query(
      'INSERT INTO audit_log (action, entity_type, entity_id, user_name, user_email, changes, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [action, entityType, entityId, userName, userEmail, JSON.stringify(changes), ipAddress]
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

// Create a new user
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and email are required'
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );

    // Log audit event
    await logAudit('CREATE', 'user', result.rows[0].id, name, email, { name, email }, req);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({
        status: 'error',
        message: 'Email already exists'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user',
        error: error.message
      });
    }
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID'
    });
  }

  if (!name || !email) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and email are required'
    });
  }

  try {
    // Get old user data for audit log
    const oldData = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (oldData.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
      [name, email, userId]
    );

    // Log audit event with before/after changes
    const changes = {
      before: { name: oldData.rows[0].name, email: oldData.rows[0].email },
      after: { name, email }
    };
    await logAudit('UPDATE', 'user', userId, name, email, changes, req);

    res.json({
      status: 'success',
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({
        status: 'error',
        message: 'Email already exists'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user',
        error: error.message
      });
    }
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID'
    });
  }

  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Log audit event
    const deletedUser = result.rows[0];
    await logAudit('DELETE', 'user', userId, deletedUser.name, deletedUser.email, { name: deletedUser.name, email: deletedUser.email }, req);

    res.json({
      status: 'success',
      message: 'User deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get audit logs
app.get('/api/audit', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1000');
    res.json({
      status: 'success',
      count: result.rows.length,
      logs: result.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// Get single user by ID
app.get('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid user ID'
    });
  }

  try {
    const result = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Get ratings for a song
app.get('/api/ratings/:title/:artist', async (req, res) => {
  const { title, artist } = req.params;

  try {
    const result = await db.query(
      `SELECT
        rating_type,
        COUNT(*) as count
       FROM song_ratings
       WHERE song_title = $1 AND song_artist = $2
       GROUP BY rating_type`,
      [decodeURIComponent(title), decodeURIComponent(artist)]
    );

    const ratings = {
      up: 0,
      down: 0
    };

    result.rows.forEach(row => {
      ratings[row.rating_type] = parseInt(row.count);
    });

    res.json({
      status: 'success',
      ratings
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ratings',
      error: error.message
    });
  }
});

// Submit a rating for a song
app.post('/api/ratings', async (req, res) => {
  const { title, artist, rating } = req.body;
  const userIp = req.ip || req.connection.remoteAddress;

  if (!title || !artist || !rating) {
    return res.status(400).json({
      status: 'error',
      message: 'Title, artist, and rating are required'
    });
  }

  if (rating !== 'up' && rating !== 'down') {
    return res.status(400).json({
      status: 'error',
      message: 'Rating must be either "up" or "down"'
    });
  }

  try {
    // Check if user already rated this song
    const existingRating = await db.query(
      'SELECT rating_type FROM song_ratings WHERE song_title = $1 AND song_artist = $2 AND user_ip = $3',
      [title, artist, userIp]
    );

    if (existingRating.rows.length > 0) {
      // User already rated - update their rating if different
      if (existingRating.rows[0].rating_type !== rating) {
        await db.query(
          'UPDATE song_ratings SET rating_type = $1, created_at = CURRENT_TIMESTAMP WHERE song_title = $2 AND song_artist = $3 AND user_ip = $4',
          [rating, title, artist, userIp]
        );

        res.json({
          status: 'success',
          message: 'Rating updated successfully'
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'You have already rated this song'
        });
      }
    } else {
      // Insert new rating
      await db.query(
        'INSERT INTO song_ratings (song_title, song_artist, rating_type, user_ip) VALUES ($1, $2, $3, $4)',
        [title, artist, rating, userIp]
      );

      res.status(201).json({
        status: 'success',
        message: 'Rating submitted successfully'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
});
