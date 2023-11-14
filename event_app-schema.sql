CREATE TABLE users
(
  username VARCHAR(25) PRIMARY KEY,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);



CREATE TABLE reviews
(
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(25) REFERENCES users (username) ON DELETE CASCADE,
  artist_id VARCHAR,
  comment TEXT,
  created_at TIMESTAMP

);

CREATE TABLE favorites
(
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(25) REFERENCES users (username) ON DELETE CASCADE,
  artist_id VARCHAR,
  artist_name TEXT,
  artist_image TEXT,
  artist_url TEXT

);










