-- ════════════════════════════════════════════
-- Run this in Supabase SQL Editor
-- supabase.com → your project → SQL Editor
-- ════════════════════════════════════════════

-- 1. Clients table
CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  domain      VARCHAR(255) NOT NULL,
  niche       VARCHAR(255),
  competitors TEXT,
  tone        VARCHAR(100),
  blog_id     VARCHAR(255),
  schedule    VARCHAR(100) DEFAULT 'daily',
  status      VARCHAR(50)  DEFAULT 'active',
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

-- 2. Articles table (with your existing columns)
CREATE TABLE IF NOT EXISTS articles (
  id               SERIAL PRIMARY KEY,
  client_id        INT REFERENCES clients(id),
  keyword          VARCHAR(255),
  search_volume    INT          DEFAULT 0,
  competition      VARCHAR(50),
  content          TEXT,
  meta_title       VARCHAR(500),
  meta_description VARCHAR(160),
  quality_score    INT          DEFAULT 0,
  status           VARCHAR(50)  DEFAULT 'scouted',
  revision_count   INT          DEFAULT 0,
  review_feedback  TEXT,
  wp_post_id       VARCHAR(255),
  wp_url           VARCHAR(500),
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- 3. Agent logs table
CREATE TABLE IF NOT EXISTS agent_logs (
  id         SERIAL PRIMARY KEY,
  client_id  INT,
  agent_name VARCHAR(100),
  article_id INT,
  action     VARCHAR(255),
  details    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
