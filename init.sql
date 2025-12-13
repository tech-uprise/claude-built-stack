-- Database initialization script for RadioCalico
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  grade VARCHAR(50) NOT NULL,
  major VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);

-- Song ratings table
CREATE TABLE IF NOT EXISTS song_ratings (
  id SERIAL PRIMARY KEY,
  song_title VARCHAR(500) NOT NULL,
  song_artist VARCHAR(500) NOT NULL,
  rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('up', 'down')),
  user_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_title, song_artist, user_ip)
);

CREATE INDEX IF NOT EXISTS idx_song_ratings_song ON song_ratings(song_title, song_artist);
CREATE INDEX IF NOT EXISTS idx_song_ratings_user ON song_ratings(user_ip);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
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

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_email);

-- Insert sample data (optional - comment out if not needed)
-- INSERT INTO users (name, email) VALUES
--   ('John Doe', 'john@example.com'),
--   ('Jane Smith', 'jane@example.com')
-- ON CONFLICT (email) DO NOTHING;

-- Grant permissions (if using a non-superuser database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radiocalco_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO radiocalco_user;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully!';
  RAISE NOTICE 'Tables created: users, students, song_ratings, audit_log';
END $$;
