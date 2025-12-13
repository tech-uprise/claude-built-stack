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

// API Routes

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
