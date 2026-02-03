-- ============================================================================
-- CampusKart Admin System Migration
-- ============================================================================
-- Purpose: Add comprehensive admin functionality for product verification,
--          user moderation, and platform analytics
-- 
-- Dependencies: Run AFTER schema.sql, rbac_migration.sql, gamification_migration.sql
-- MySQL Version: 8.0+
-- Idempotent: Yes (uses IF NOT EXISTS, IGNORE)
-- ============================================================================

USE campuskart;

-- ============================================================================
-- TABLE 1: ADMIN USERS
-- ============================================================================
-- Stores admin accounts separately from student users
-- Admins have elevated privileges for moderation and verification
-- Role hierarchy: super_admin > moderator
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role ENUM('super_admin', 'moderator') NOT NULL DEFAULT 'moderator',
  
  -- Account status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure email format is valid
  CONSTRAINT chk_admin_email_format CHECK (email LIKE '%_@__%.__%'),
  
  -- Index for login queries
  INDEX idx_admin_email (email),
  INDEX idx_admin_role (role),
  INDEX idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
COMMENT='Admin users for platform moderation and verification';


-- ============================================================================
-- TABLE 2: PRODUCT VERIFICATION
-- ============================================================================
-- Tracks verification status for every product listing
-- Auto-flags suspicious content, manual admin review
-- Prevents fraudulent listings from appearing to students
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_verification (
  verification_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  
  -- Verification status workflow
  status ENUM(
    'pending',      -- Newly submitted, awaiting review
    'approved',     -- Admin verified as legitimate
    'rejected',     -- Admin rejected (spam, policy violation)
    'flagged',      -- Auto-flagged for suspicious content
    'resubmitted'   -- Seller resubmitted after rejection
  ) NOT NULL DEFAULT 'pending',
  
  -- Admin who processed this verification
  verified_by INT NULL DEFAULT NULL,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  
  -- Rejection details (only for rejected/flagged status)
  rejection_reason VARCHAR(500) NULL DEFAULT NULL,
  admin_notes TEXT NULL DEFAULT NULL,
  
  -- Auto-flagging metadata (JSON or TEXT)
  -- Example: {"keywords": ["suspicious"], "duplicate_image": true}
  flag_details TEXT NULL DEFAULT NULL,
  
  -- Trust score at time of submission (for pattern detection)
  seller_trust_score INT NULL DEFAULT NULL,
  
  -- Audit timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT fk_pv_product FOREIGN KEY (product_id) 
    REFERENCES products(pid) ON DELETE CASCADE,
  CONSTRAINT fk_pv_admin FOREIGN KEY (verified_by) 
    REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  
  -- Indexes for admin dashboard queries
  INDEX idx_pv_status (status),
  INDEX idx_pv_product (product_id),
  INDEX idx_pv_admin (verified_by),
  INDEX idx_pv_created (created_at DESC),
  
  -- Composite index for pending queue
  INDEX idx_pv_pending_queue (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Product verification and moderation tracking';


-- ============================================================================
-- TABLE 3: ADMIN ACTIONS LOG
-- ============================================================================
-- Complete audit trail of all admin actions
-- Enables accountability and compliance
-- Tracks who did what, when, and to whom
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_actions_log (
  action_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  
  -- Action categorization
  action_type ENUM(
    'approved_product',
    'rejected_product',
    'flagged_product',
    'suspended_user',
    'unsuspended_user',
    'deleted_product',
    'edited_product',
    'manual_trust_adjustment',
    'badge_granted',
    'badge_revoked',
    'other'
  ) NOT NULL,
  
  -- Target of the action (product_id, user_id, etc.)
  target_type ENUM('product', 'user', 'transaction', 'other') NOT NULL,
  target_id INT NOT NULL,
  
  -- Detailed action metadata (JSON format recommended)
  -- Example: {"reason": "Spam content", "previous_status": "pending"}
  details TEXT NULL DEFAULT NULL,
  
  -- IP address for security tracking
  ip_address VARCHAR(45) NULL DEFAULT NULL,
  
  -- When action occurred
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to admin who performed action
  CONSTRAINT fk_aal_admin FOREIGN KEY (admin_id) 
    REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  
  -- Indexes for audit queries
  INDEX idx_aal_admin (admin_id),
  INDEX idx_aal_type (action_type),
  INDEX idx_aal_timestamp (timestamp DESC),
  INDEX idx_aal_target (target_type, target_id),
  
  -- Composite index for filtering by admin + date range
  INDEX idx_aal_admin_time (admin_id, timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Audit trail of all admin actions for compliance';


-- ============================================================================
-- TABLE 4: USER SUSPENSIONS
-- ============================================================================
-- Tracks temporary and permanent user suspensions
-- Prevents suspended users from listing/buying
-- Supports appeal workflow through is_active flag
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_suspensions (
  suspension_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  suspended_by INT NOT NULL,
  
  -- Suspension details
  reason VARCHAR(500) NOT NULL,
  internal_notes TEXT NULL DEFAULT NULL,
  
  -- Suspension duration
  suspended_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  suspended_until TIMESTAMP NULL DEFAULT NULL, -- NULL = permanent ban
  
  -- Status management
  is_active BOOLEAN NOT NULL DEFAULT true,  -- false = suspension lifted/appealed
  lifted_by INT NULL DEFAULT NULL,
  lifted_at TIMESTAMP NULL DEFAULT NULL,
  lift_reason VARCHAR(500) NULL DEFAULT NULL,
  
  -- Foreign keys
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) 
    REFERENCES users(uid) ON DELETE CASCADE,
  CONSTRAINT fk_us_admin FOREIGN KEY (suspended_by) 
    REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  CONSTRAINT fk_us_lifted FOREIGN KEY (lifted_by) 
    REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  
  -- Indexes for suspension checks
  INDEX idx_us_user (user_id),
  INDEX idx_us_active (is_active),
  INDEX idx_us_until (suspended_until),
  
  -- Composite index for active suspension check
  INDEX idx_us_active_check (user_id, is_active, suspended_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='User suspension tracking for moderation';


-- ============================================================================
-- TABLE 5: DAILY ANALYTICS STATS
-- ============================================================================
-- Pre-aggregated daily statistics for admin dashboard
-- Avoids expensive real-time COUNT(*) queries on large tables
-- Updated via scheduled job or trigger
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date DATE PRIMARY KEY,
  
  -- User metrics
  total_users INT NOT NULL DEFAULT 0,
  new_users_today INT NOT NULL DEFAULT 0,
  active_users_today INT NOT NULL DEFAULT 0,  -- Users who listed/bought
  
  -- Product metrics
  total_products INT NOT NULL DEFAULT 0,
  new_products_today INT NOT NULL DEFAULT 0,
  available_products INT NOT NULL DEFAULT 0,
  sold_products_today INT NOT NULL DEFAULT 0,
  
  -- Transaction metrics
  total_transactions INT NOT NULL DEFAULT 0,
  completed_transactions_today INT NOT NULL DEFAULT 0,
  total_revenue_today DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Moderation metrics
  pending_verifications INT NOT NULL DEFAULT 0,
  flagged_products INT NOT NULL DEFAULT 0,
  active_suspensions INT NOT NULL DEFAULT 0,
  
  -- When this stat was last updated
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Index for date range queries
  INDEX idx_ds_date (stat_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Pre-aggregated daily statistics for admin dashboard';


-- ============================================================================
-- TABLE 6: CATEGORY ANALYTICS
-- ============================================================================
-- Category-level analytics for marketplace insights
-- Helps admins identify trending categories and pricing patterns
-- Updated periodically (daily or weekly)
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_stats (
  category VARCHAR(100) PRIMARY KEY,
  
  -- Product metrics
  product_count INT NOT NULL DEFAULT 0,
  available_count INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  
  -- Price analytics
  avg_price DECIMAL(10,2) NULL DEFAULT NULL,
  min_price DECIMAL(10,2) NULL DEFAULT NULL,
  max_price DECIMAL(10,2) NULL DEFAULT NULL,
  median_price DECIMAL(10,2) NULL DEFAULT NULL,
  
  -- Engagement metrics
  total_wishlist_adds INT NOT NULL DEFAULT 0,
  avg_sale_time_hours DECIMAL(10,2) NULL DEFAULT NULL, -- Time to sell
  
  -- When this category stat was last updated
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key to ensure category exists in products
  -- Note: This is a soft reference since products.category is not a FK
  INDEX idx_cs_updated (last_updated DESC),
  INDEX idx_cs_count (product_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COMMENT='Category-level analytics for marketplace insights';


-- ============================================================================
-- SAMPLE DATA: ADMIN USERS
-- ============================================================================
-- Test admin accounts for development
-- Passwords are hashed using bcrypt (example hashes, replace in production)
-- Password: 'Admin@123' for all test accounts
-- ============================================================================

INSERT IGNORE INTO admin_users (admin_id, email, password_hash, full_name, role, is_active) VALUES
  (
    1,
    'super.admin@campuskart.edu',
    '$2b$10$YourBcryptHashHere1234567890123456789012345678901234',  -- Replace with real hash
    'John Smith',
    'super_admin',
    true
  ),
  (
    2,
    'moderator1@campuskart.edu',
    '$2b$10$YourBcryptHashHere1234567890123456789012345678901234',  -- Replace with real hash
    'Sarah Johnson',
    'moderator',
    true
  ),
  (
    3,
    'moderator2@campuskart.edu',
    '$2b$10$YourBcryptHashHere1234567890123456789012345678901234',  -- Replace with real hash
    'Mike Davis',
    'moderator',
    true
  );


-- ============================================================================
-- SAMPLE DATA: PRODUCT VERIFICATION
-- ============================================================================
-- Example verification records for testing admin workflows
-- ============================================================================

-- Note: Assumes products with pid 1, 2, 3 exist from seed.sql
INSERT IGNORE INTO product_verification (verification_id, product_id, status, verified_by, verified_at, seller_trust_score) VALUES
  (1, 1, 'approved', 1, NOW(), 50),
  (2, 2, 'pending', NULL, NULL, 30),
  (3, 3, 'flagged', NULL, NULL, 10);

-- Update flagged product with auto-flag details
UPDATE product_verification 
SET flag_details = '{"keywords": ["urgent", "limited"], "low_trust": true}',
    admin_notes = 'Auto-flagged: Low seller trust score + suspicious keywords'
WHERE verification_id = 3;


-- ============================================================================
-- SAMPLE DATA: ADMIN ACTIONS LOG
-- ============================================================================
-- Example audit trail entries
-- ============================================================================

INSERT IGNORE INTO admin_actions_log (action_id, admin_id, action_type, target_type, target_id, details, timestamp) VALUES
  (
    1,
    1,
    'approved_product',
    'product',
    1,
    '{"reason": "Verified product authenticity", "previous_status": "pending"}',
    NOW()
  ),
  (
    2,
    2,
    'flagged_product',
    'product',
    3,
    '{"reason": "Suspicious keywords detected", "auto_flagged": true}',
    NOW()
  );


-- ============================================================================
-- SAMPLE DATA: CATEGORY STATS
-- ============================================================================
-- Initial category analytics (empty, to be populated by analytics job)
-- ============================================================================

INSERT IGNORE INTO category_stats (category, product_count, available_count, avg_price) VALUES
  ('Books', 0, 0, 0.00),
  ('Electronics', 0, 0, 0.00),
  ('Clothing', 0, 0, 0.00),
  ('Sports', 0, 0, 0.00),
  ('Stationery', 0, 0, 0.00);



-- Admin login performance
SET @idx_admin_login := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'admin_users'
    AND index_name = 'idx_admin_login'
);
SET @sql_admin_login := IF(
  @idx_admin_login > 0,
  'DROP INDEX idx_admin_login ON admin_users',
  'SELECT 1'
);
PREPARE stmt_admin_login FROM @sql_admin_login;
EXECUTE stmt_admin_login;
DEALLOCATE PREPARE stmt_admin_login;
CREATE INDEX idx_admin_login 
ON admin_users(email, is_active);

-- Product verification queue ordered by creation time
SET @idx_pv_queue := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'product_verification'
    AND index_name = 'idx_pv_queue'
);
SET @sql_pv_queue := IF(
  @idx_pv_queue > 0,
  'DROP INDEX idx_pv_queue ON product_verification',
  'SELECT 1'
);
PREPARE stmt_pv_queue FROM @sql_pv_queue;
EXECUTE stmt_pv_queue;
DEALLOCATE PREPARE stmt_pv_queue;
CREATE INDEX idx_pv_queue 
ON product_verification(status, created_at);


-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================
-- Display created tables for verification
-- ============================================================================

SELECT 
  'Admin Migration Complete!' AS status,
  COUNT(*) AS admin_tables_created
FROM information_schema.tables 
WHERE table_schema = 'campuskart' 
  AND table_name IN (
    'admin_users',
    'product_verification',
    'admin_actions_log',
    'user_suspensions',
    'daily_stats',
    'category_stats'
  );

-- Show sample admin users
SELECT 
  admin_id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM admin_users
ORDER BY admin_id;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 
-- 1. SECURITY CONSIDERATIONS:
--    - Replace sample password hashes with real bcrypt hashes
--    - Use environment variables for default admin credentials
--    - Enable SSL/TLS for admin panel access
--    - Implement rate limiting on admin login endpoint
-- 
-- 2. INTEGRATION REQUIREMENTS:
--    - Backend must check product_verification.status before displaying products
--    - Backend must check user_suspensions before allowing transactions
--    - Frontend admin panel needs to be built (React recommended)
--    - Add middleware to verify admin_users.role for protected routes
-- 
-- 3. ANALYTICS JOBS:
--    - Schedule daily job to populate daily_stats table
--    - Schedule weekly job to update category_stats
--    - Consider using MySQL events or cron jobs
-- 
-- 4. AUTO-FLAGGING RULES (Backend Implementation):
--    - Flag products with seller trust_points < 20
--    - Flag products with keywords: "urgent", "limited time", "guaranteed"
--    - Flag duplicate image hashes (requires image processing)
--    - Flag products priced > 3x category average
-- 
-- 5. NEXT STEPS:
--    - Build admin authentication endpoint: POST /api/admin/login
--    - Build admin dashboard API: GET /api/admin/dashboard/stats
--    - Build verification queue API: GET /api/admin/products/pending
--    - Build suspension management API: POST /api/admin/users/suspend
--    - Add admin role middleware to protect routes
-- 
-- ============================================================================
