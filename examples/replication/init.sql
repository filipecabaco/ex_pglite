-- Initialize database with sample schema and data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (name, email, age) VALUES
    ('Alice Johnson', 'alice@example.com', 28),
    ('Bob Smith', 'bob@example.com', 32),
    ('Carol Davis', 'carol@example.com', 25),
    ('David Wilson', 'david@example.com', 35),
    ('Eve Brown', 'eve@example.com', 29)
ON CONFLICT (email) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (user_id, title, content, published) VALUES
    (1, 'Welcome to My Blog', 'This is my first blog post. Welcome everyone!', true),
    (2, 'Learning Elixir', 'Elixir is an amazing language for building concurrent applications.', true),
    (3, 'Database Replication', 'Real-time data sync is crucial for modern applications.', true),
    (1, 'Draft Post', 'This post is still being written...', false),
    (4, 'Docker Tips', 'Some useful Docker tips and tricks for developers.', true);

-- Grant replication privileges to postgres user
ALTER USER postgres WITH REPLICATION;
