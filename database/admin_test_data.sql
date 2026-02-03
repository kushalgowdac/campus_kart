-- ============================================================================
-- CampusKart Admin Test Data
-- ============================================================================
-- Purpose: Insert sample test data for admin system testing
-- Usage: Run after admin_migration.sql
-- Note: Passwords are hashed with bcrypt (salt rounds: 10)
-- ============================================================================

USE campuskart;

-- ============================================================================
-- 1. ADMIN USERS
-- ============================================================================
-- Creating 3 admin users for testing:
-- 1. Super Admin (full access)
-- 2. Moderator 1 (limited access)
-- 3. Moderator 2 (limited access)
-- ============================================================================

-- Password: Admin@123 (bcrypt hash, 10 rounds)
-- To generate: await bcrypt.hash('Admin@123', 10)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active) VALUES
('admin@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'System Administrator', 'super_admin', true),
('moderator1@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'Moderator One', 'moderator', true),
('moderator2@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'Moderator Two', 'moderator', true)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    role = VALUES(role),
    is_active = VALUES(is_active);

-- NOTE: In production, generate actual bcrypt hashes for real passwords
-- Example in Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('YourSecurePassword123!', 10);


-- ============================================================================
-- 2. TEST STUDENT USERS
-- ============================================================================
-- Creating test student users for product/transaction testing
-- These users will be product sellers and buyers
-- ============================================================================

INSERT IGNORE INTO users (name, email, password) VALUES
('Test Seller 1', 'seller1@rvce.edu.in', '$2b$10$testHashForSeller1'),
('Test Seller 2', 'seller2@rvce.edu.in', '$2b$10$testHashForSeller2'),
('Test Seller 3', 'seller3@rvce.edu.in', '$2b$10$testHashForSeller3'),
('Test Buyer 1', 'buyer1@rvce.edu.in', '$2b$10$testHashForBuyer1'),
('Test Buyer 2', 'buyer2@rvce.edu.in', '$2b$10$testHashForBuyer2');

-- Get the auto-generated user IDs
SET @seller1_id = (SELECT uid FROM users WHERE email = 'seller1@rvce.edu.in');
SET @seller2_id = (SELECT uid FROM users WHERE email = 'seller2@rvce.edu.in');
SET @seller3_id = (SELECT uid FROM users WHERE email = 'seller3@rvce.edu.in');
SET @buyer1_id = (SELECT uid FROM users WHERE email = 'buyer1@rvce.edu.in');
SET @buyer2_id = (SELECT uid FROM users WHERE email = 'buyer2@rvce.edu.in');


-- ============================================================================
-- 3. PENDING PRODUCTS (For Verification Testing)
-- ============================================================================
-- Creating 5 products with "pending" verification status
-- These will appear in the "Pending Products" tab
-- ============================================================================

-- Product 1: Normal laptop (should NOT be auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Dell Latitude E7470 Laptop', 'Electronics', 15000.00, 'available', 2022, '2nd', 1);
SET @product1_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product1_id, @seller1_id);
INSERT INTO prod_loc (pid, location) VALUES (@product1_id, 'Kriyakalpa');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product1_id, 'RAM', '8GB'),
(@product1_id, 'Processor', 'Intel i5'),
(@product1_id, 'Condition', 'Good');
INSERT INTO prod_img (pid, img_url) VALUES (@product1_id, '/images/laptop1.jpg');

INSERT INTO product_verification (product_id, status) VALUES (@product1_id, 'pending');


-- Product 2: Textbook (should NOT be auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Engineering Mathematics Textbook', 'Books', 300.00, 'available', 2023, '1st', 2);
SET @product2_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product2_id, @seller1_id);
INSERT INTO prod_loc (pid, location) VALUES (@product2_id, 'Mingos');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product2_id, 'Author', 'B.S. Grewal'),
(@product2_id, 'Edition', '42nd'),
(@product2_id, 'Condition', 'Excellent');

INSERT INTO prod_img (pid, img_url) VALUES (@product2_id, '/images/Engineering%20Mathematics%20Textbook.jpg');

INSERT INTO product_verification (product_id, status) VALUES (@product2_id, 'pending');


-- Product 3: Bicycle (should NOT be auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Hero DTB Cycle', 'Vehicles', 2500.00, 'available', 2021, 'all', 1);
SET @product3_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product3_id, @seller2_id);
INSERT INTO prod_loc (pid, location) VALUES (@product3_id, 'CS ground');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product3_id, 'Gear', '7-speed'),
(@product3_id, 'Condition', 'Fair'),
(@product3_id, 'Color', 'Black');

INSERT INTO prod_img (pid, img_url) VALUES (@product3_id, '/images/cycle1.jpg');

INSERT INTO product_verification (product_id, status) VALUES (@product3_id, 'pending');


-- Product 4: Gaming Mouse (should NOT be auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Logitech G502 Gaming Mouse', 'Electronics', 3500.00, 'available', 2023, 'all', 1);
SET @product4_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product4_id, @seller2_id);
INSERT INTO prod_loc (pid, location) VALUES (@product4_id, 'Kriyakalpa');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product4_id, 'DPI', '16000'),
(@product4_id, 'Buttons', '11'),
(@product4_id, 'Condition', 'Like New');

INSERT INTO prod_img (pid, img_url) VALUES (@product4_id, '/images/mouse.jpg');

INSERT INTO product_verification (product_id, status) VALUES (@product4_id, 'pending');


-- Product 5: Desk Lamp (should NOT be auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('LED Study Desk Lamp', 'Furniture', 800.00, 'available', 2023, 'all', 1);
SET @product5_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product5_id, @seller3_id);
INSERT INTO prod_loc (pid, location) VALUES (@product5_id, 'Mingos');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product5_id, 'Type', 'LED'),
(@product5_id, 'Color', 'White'),
(@product5_id, 'Condition', 'Excellent');

INSERT INTO prod_img (pid, img_url) VALUES (@product5_id, '/images/Desk%20Organizer.jpg');

INSERT INTO product_verification (product_id, status) VALUES (@product5_id, 'pending');


-- ============================================================================
-- 4. FLAGGED PRODUCTS (Auto-Flagged by System)
-- ============================================================================
-- Creating 3 products that will be auto-flagged:
-- - Product 6: Contains keyword "fake"
-- - Product 7: Price > ₹50,000
-- - Product 8: Contains keyword "scam" AND high price
-- ============================================================================

-- Product 6: Fake keyword trigger (auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('Authentic Nike Shoes (NOT FAKE)', 'Accessories', 4500.00, 'available', 2023, 'all', 1);
SET @product6_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product6_id, @seller3_id);
INSERT INTO prod_loc (pid, location) VALUES (@product6_id, 'Kriyakalpa');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product6_id, 'Size', '9'),
(@product6_id, 'Condition', 'New');

INSERT INTO prod_img (pid, img_url) VALUES (@product6_id, '/images/bag1.jpg');

-- This will be manually flagged later by auto-flagging system
INSERT INTO product_verification (product_id, status, flag_details, admin_notes) VALUES 
(@product6_id, 'flagged', '{"reasons": ["keyword:fake"]}', 'Auto-flagged due to keyword:fake');


-- Product 7: High price trigger (auto-flagged)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('MacBook Pro 16" M2 Max', 'Electronics', 185000.00, 'available', 2023, 'all', 1);
SET @product7_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product7_id, @seller1_id);
INSERT INTO prod_loc (pid, location) VALUES (@product7_id, 'Mingos');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product7_id, 'RAM', '32GB'),
(@product7_id, 'Storage', '1TB SSD'),
(@product7_id, 'Condition', 'Excellent');

INSERT INTO prod_img (pid, img_url) VALUES (@product7_id, '/images/laptop2.jpg');

-- This will be manually flagged later by auto-flagging system
INSERT INTO product_verification (product_id, status, flag_details, admin_notes) VALUES 
(@product7_id, 'flagged', '{"reasons": ["price>50000"]}', 'Auto-flagged due to price>50000');


-- Product 8: Multiple triggers (keyword + price)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
('iPhone 14 Pro Max - No scam guaranteed!', 'Electronics', 95000.00, 'available', 2023, 'all', 1);
SET @product8_id = LAST_INSERT_ID();

INSERT INTO product_seller (pid, sellerid) VALUES (@product8_id, @seller2_id);
INSERT INTO prod_loc (pid, location) VALUES (@product8_id, 'CS ground');
INSERT INTO prod_spec (pid, spec_name, spec_value) VALUES 
(@product8_id, 'Storage', '256GB'),
(@product8_id, 'Color', 'Space Black'),
(@product8_id, 'Condition', 'Brand New');

INSERT INTO prod_img (pid, img_url) VALUES (@product8_id, '/images/phone4.jpg');

-- This will be manually flagged later by auto-flagging system
INSERT INTO product_verification (product_id, status, flag_details, admin_notes) VALUES 
(@product8_id, 'flagged', '{"reasons": ["keyword:scam", "price>50000"]}', 'Auto-flagged due to keyword:scam, price>50000');


-- ============================================================================
-- 5. SUSPENDED USERS
-- ============================================================================
-- Creating 2 suspended user records
-- User suspension prevents login and marketplace activity
-- ============================================================================

-- Get admin_id for super_admin
SET @admin_id = (SELECT admin_id FROM admin_users WHERE role = 'super_admin' LIMIT 1);

-- Suspend seller3 for 7 days (reason: suspicious activity)
INSERT INTO user_suspensions (user_id, suspended_by, reason, suspended_until) VALUES
(@seller3_id, @admin_id, 'Multiple reports of misleading product descriptions', DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Suspend buyer2 permanently (reason: fraudulent transactions)
INSERT INTO user_suspensions (user_id, suspended_by, reason, suspended_until) VALUES
(@buyer2_id, @admin_id, 'Confirmed fraudulent payment reversals', NULL);

-- NOTE: Frontend should update users table or use JOINs to check suspension status


-- ============================================================================
-- 6. ADMIN ACTIONS LOG (Sample Activity)
-- ============================================================================
-- Pre-populating admin action logs to show activity in dashboard
-- ============================================================================

INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details, ip_address, timestamp) VALUES
-- Recent admin logins (stored as action_type = 'other')
(@admin_id, 'other', 'other', 0, '{"event": "login", "ip": "192.168.1.100"}', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(@admin_id, 'other', 'other', 0, '{"event": "login", "ip": "192.168.1.100"}', '192.168.1.100', DATE_SUB(NOW(), INTERVAL 5 HOUR)),

-- Product verification actions
(@admin_id, 'flagged_product', 'product', @product6_id, '{"reason": "Auto-flagged: keyword:fake"}', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@admin_id, 'flagged_product', 'product', @product7_id, '{"reason": "Auto-flagged: price>50000"}', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(@admin_id, 'flagged_product', 'product', @product8_id, '{"reason": "Auto-flagged: keyword:scam, price>50000"}', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- User suspension actions
(@admin_id, 'suspended_user', 'user', @seller3_id, '{"reason": "Multiple reports of misleading product descriptions", "duration": "7 days"}', NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(@admin_id, 'suspended_user', 'user', @buyer2_id, '{"reason": "Confirmed fraudulent payment reversals", "duration": "permanent"}', NULL, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),

-- Export actions (stored as action_type = 'other')
(@admin_id, 'other', 'other', 0, '{"event": "export_transactions", "date_range": "2024-01-01 to 2024-01-31", "format": "csv"}', NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(@admin_id, 'other', 'other', 0, '{"event": "export_users", "format": "csv"}', NULL, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),

-- Logout
(@admin_id, 'other', 'other', 0, '{"event": "logout"}', NULL, DATE_SUB(NOW(), INTERVAL 1 MINUTE));


-- ============================================================================
-- 7. SAMPLE DAILY STATS (For Analytics Testing)
-- ============================================================================
-- Pre-populating analytics data for dashboard testing
-- ============================================================================

-- Last 30 days of stats
INSERT INTO daily_stats (stat_date, new_users_today, new_products_today, completed_transactions_today) VALUES
(DATE_SUB(CURDATE(), INTERVAL 30 DAY), 5, 12, 3),
(DATE_SUB(CURDATE(), INTERVAL 29 DAY), 3, 8, 2),
(DATE_SUB(CURDATE(), INTERVAL 28 DAY), 7, 15, 5),
(DATE_SUB(CURDATE(), INTERVAL 27 DAY), 4, 10, 4),
(DATE_SUB(CURDATE(), INTERVAL 26 DAY), 6, 13, 6),
(DATE_SUB(CURDATE(), INTERVAL 25 DAY), 2, 7, 1),
(DATE_SUB(CURDATE(), INTERVAL 24 DAY), 8, 18, 7),
(DATE_SUB(CURDATE(), INTERVAL 23 DAY), 5, 11, 4),
(DATE_SUB(CURDATE(), INTERVAL 22 DAY), 3, 9, 3),
(DATE_SUB(CURDATE(), INTERVAL 21 DAY), 6, 14, 5),
(DATE_SUB(CURDATE(), INTERVAL 20 DAY), 4, 10, 2),
(DATE_SUB(CURDATE(), INTERVAL 19 DAY), 7, 16, 6),
(DATE_SUB(CURDATE(), INTERVAL 18 DAY), 3, 8, 3),
(DATE_SUB(CURDATE(), INTERVAL 17 DAY), 5, 12, 4),
(DATE_SUB(CURDATE(), INTERVAL 16 DAY), 9, 20, 8),
(DATE_SUB(CURDATE(), INTERVAL 15 DAY), 4, 11, 3),
(DATE_SUB(CURDATE(), INTERVAL 14 DAY), 6, 15, 5),
(DATE_SUB(CURDATE(), INTERVAL 13 DAY), 2, 6, 2),
(DATE_SUB(CURDATE(), INTERVAL 12 DAY), 8, 17, 7),
(DATE_SUB(CURDATE(), INTERVAL 11 DAY), 5, 13, 4),
(DATE_SUB(CURDATE(), INTERVAL 10 DAY), 7, 16, 6),
(DATE_SUB(CURDATE(), INTERVAL 9 DAY), 3, 9, 3),
(DATE_SUB(CURDATE(), INTERVAL 8 DAY), 6, 14, 5),
(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 4, 10, 4),
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 8, 18, 7),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 5, 12, 5),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 7, 15, 6),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 3, 8, 2),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 6, 13, 5),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 9, 19, 8)
ON DUPLICATE KEY UPDATE
    new_users_today = VALUES(new_users_today),
    new_products_today = VALUES(new_products_today),
    completed_transactions_today = VALUES(completed_transactions_today),
    updated_at = CURRENT_TIMESTAMP;


-- ============================================================================
-- 8. CATEGORY STATS (For Analytics Testing)
-- ============================================================================

INSERT INTO category_stats (
    category,
    product_count,
    available_count,
    sold_count,
    avg_price,
    min_price,
    max_price,
    median_price,
    total_wishlist_adds,
    avg_sale_time_hours
) VALUES
('Electronics', 245, 180, 65, 18500.00, 300.00, 185000.00, 12000.00, 920, 72.5),
('Books', 189, 160, 29, 350.00, 50.00, 1200.00, 300.00, 640, 36.0),
('Accessories', 156, 120, 36, 1200.00, 100.00, 4500.00, 950.00, 410, 48.0),
('Furniture', 78, 60, 18, 3500.00, 500.00, 12000.00, 3000.00, 190, 96.0),
('Vehicles', 34, 20, 14, 5500.00, 1200.00, 25000.00, 4800.00, 85, 120.0),
('Sports', 45, 36, 9, 2200.00, 250.00, 8000.00, 1800.00, 120, 54.0),
('Stationery', 112, 98, 14, 150.00, 20.00, 800.00, 120.00, 300, 24.0)
ON DUPLICATE KEY UPDATE
    product_count = VALUES(product_count),
    available_count = VALUES(available_count),
    sold_count = VALUES(sold_count),
    avg_price = VALUES(avg_price),
    min_price = VALUES(min_price),
    max_price = VALUES(max_price),
    median_price = VALUES(median_price),
    total_wishlist_adds = VALUES(total_wishlist_adds),
    avg_sale_time_hours = VALUES(avg_sale_time_hours),
    last_updated = CURRENT_TIMESTAMP;


-- ============================================================================
-- VERIFICATION & TESTING QUERIES
-- ============================================================================
-- Run these queries to verify test data was inserted correctly
-- ============================================================================

-- Verify admin users
-- SELECT * FROM admin_users;

-- Verify pending products count
-- SELECT COUNT(*) as pending_count FROM product_verification WHERE status = 'pending';

-- Verify flagged products count
-- SELECT COUNT(*) as flagged_count FROM product_verification WHERE status = 'flagged';

-- Verify suspended users
-- SELECT u.email, us.reason, us.suspended_until 
-- FROM user_suspensions us 
-- JOIN users u ON us.user_id = u.uid;

-- Verify admin action logs
-- SELECT COUNT(*) as log_count FROM admin_actions_log;

-- View all test products with verification status
-- SELECT p.pid, p.pname, p.price, pv.status, pv.flag_details
-- FROM products p
-- LEFT JOIN product_verification pv ON p.pid = pv.product_id
-- ORDER BY p.pid;


-- ============================================================================
-- CLEANUP (OPTIONAL)
-- ============================================================================
-- To remove all test data and start fresh, run:
-- 
-- DELETE FROM admin_actions_log WHERE admin_id IN (SELECT admin_id FROM admin_users WHERE email LIKE '%@rvce.edu.in%');
-- DELETE FROM user_suspensions;
-- DELETE FROM product_verification;
-- DELETE FROM prod_img WHERE pid IN (SELECT pid FROM products WHERE pname LIKE '%Test%' OR pname LIKE '%Dell%');
-- DELETE FROM prod_loc WHERE pid IN (SELECT pid FROM products WHERE pname LIKE '%Test%' OR pname LIKE '%Dell%');
-- DELETE FROM prod_spec WHERE pid IN (SELECT pid FROM products WHERE pname LIKE '%Test%' OR pname LIKE '%Dell%');
-- DELETE FROM product_seller WHERE pid IN (SELECT pid FROM products WHERE pname LIKE '%Test%' OR pname LIKE '%Dell%');
-- DELETE FROM products WHERE pname LIKE '%Test%' OR pname LIKE '%Dell%' OR pname LIKE '%Hero%' OR pname LIKE '%Logitech%';
-- DELETE FROM users WHERE email LIKE '%@rvce.edu.in%';
-- DELETE FROM admin_users WHERE email LIKE '%@rvce.edu.in%';
-- DELETE FROM daily_stats;
-- DELETE FROM category_stats;
-- ============================================================================


-- ============================================================================
-- TEST CREDENTIALS SUMMARY
-- ============================================================================
-- 
-- ADMIN ACCOUNTS (Password for all: Admin@123)
-- ┌──────────────────────────┬───────────────┐
-- │ Email                    │ Role          │
-- ├──────────────────────────┼───────────────┤
-- │ admin@rvce.edu.in        │ super_admin   │
-- │ moderator1@rvce.edu.in   │ moderator     │
-- │ moderator2@rvce.edu.in   │ moderator     │
-- └──────────────────────────┴───────────────┘
-- 
-- PENDING PRODUCTS FOR VERIFICATION
-- - 5 products awaiting approval
-- - None should auto-flag (normal items)
-- 
-- FLAGGED PRODUCTS FOR REVIEW
-- - 3 products auto-flagged by system
-- - Reasons: keyword triggers, high price
-- 
-- SUSPENDED USERS
-- - seller3@rvce.edu.in (7 days suspension)
-- - buyer2@rvce.edu.in (permanent suspension)
-- 
-- ============================================================================

SELECT '✅ Test data inserted successfully!' as Status,
       (SELECT COUNT(*) FROM admin_users) as AdminUsers,
       (SELECT COUNT(*) FROM product_verification WHERE status = 'pending') as PendingProducts,
       (SELECT COUNT(*) FROM product_verification WHERE status = 'flagged') as FlaggedProducts,
       (SELECT COUNT(*) FROM user_suspensions) as SuspendedUsers,
       (SELECT COUNT(*) FROM admin_actions_log) as AdminActions;
