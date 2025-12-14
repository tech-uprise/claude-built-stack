const { Pool } = require('pg');
require('dotenv').config();

// Smart host detection for different environments
// - Local/Test: Use localhost (even if .env says 'db')
// - Docker: Use 'db' (docker-compose sets DB_HOST=db)
// - AWS: Use RDS endpoint (App Runner sets DB_HOST)
function getDbHost() {
  const envHost = process.env.DB_HOST;

  // If DB_HOST is 'db' but we're not in Docker, use localhost
  // Docker sets HOSTNAME to container ID, local machines don't
  if (envHost === 'db' && !process.env.HOSTNAME?.startsWith('radiocalco')) {
    return 'localhost';
  }

  return envHost || 'localhost';
}

const pool = new Pool({
  host: getDbHost(),
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'radiocalco_dev',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || '',
  // Enable SSL for AWS RDS connections
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
