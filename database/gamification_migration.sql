-- CampusKart Gamification Migration
-- Adds Trust Score + Badges + Ratings with minimal changes.
-- MySQL 8.0+ recommended (uses IF NOT EXISTS in ALTER).

USE campuskart;

-- 1) Trust score on users
SET @has_trust_points := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'trust_points'
);

SET @sql_add_trust_points := IF(
  @has_trust_points = 0,
  'ALTER TABLE users ADD COLUMN trust_points INT NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE stmt FROM @sql_add_trust_points;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Badges catalog
CREATE TABLE IF NOT EXISTS badges (
  badge_key VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Earned badges per user
CREATE TABLE IF NOT EXISTS user_badges (
  uid INT NOT NULL,
  badge_key VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uid, badge_key),
  CONSTRAINT fk_user_badges_user FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_key) REFERENCES badges(badge_key) ON DELETE CASCADE
);

-- 3) Ratings (optional but enables rating-based trust points)
CREATE TABLE IF NOT EXISTS user_ratings (
  rating_id INT PRIMARY KEY AUTO_INCREMENT,
  pid INT NOT NULL,
  rater_uid INT NOT NULL,
  ratee_uid INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uniq_rating_once (pid, rater_uid),
  INDEX idx_ratings_ratee (ratee_uid),
  INDEX idx_ratings_pid (pid),
  CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_uid) REFERENCES users(uid) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_ratee FOREIGN KEY (ratee_uid) REFERENCES users(uid) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_product FOREIGN KEY (pid) REFERENCES products(pid) ON DELETE CASCADE
);

-- Seed core badges (idempotent)
INSERT IGNORE INTO badges (badge_key, name, description, icon) VALUES
  ('first_trade', 'First Trade', 'Completed your first successful trade.', '🤝'),
  ('trusted_user', 'Trusted User', 'Reached a trust score of 100+ points.', '✅'),
  ('power_seller', 'Power Seller', 'Completed 5+ sales on CampusKart.', '⚡');
