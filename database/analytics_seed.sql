-- ===================================================================
-- CampusKart Analytics Seed Data
-- Purpose: Generate realistic transaction history and activity data
--          for meaningful dashboard analytics and visualizations
-- ===================================================================

USE campuskart;

-- ===================================================================
-- STEP 1: Create Additional Users for Diverse Activity
-- ===================================================================

INSERT IGNORE INTO users (name, email, password, role, trust_points) VALUES
('Priya Menon', 'priya.menon@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 85),
('Rahul Verma', 'rahul.v@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 92),
('Sneha Patil', 'sneha.p@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 78),
('Arjun Nair', 'arjun.n@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 88),
('Divya Krishnan', 'divya.k@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 95),
('Karthik Reddy', 'karthik.r@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 82),
('Meera Iyer', 'meera.i@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 90),
('Ravi Kumar', 'ravi.k@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 75),
('Shruti Desai', 'shruti.d@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 87),
('Aditya Shenoy', 'aditya.s@rvce.edu.in', '$2b$10$xS99MVPb9TdpOFM/sQaAZOaQic01mAHlE95TdqBrCXYsDUIKm/nS2', 'user', 91);

-- ===================================================================
-- STEP 2: Add More Products for Transaction History
-- ===================================================================

-- Books (PIDs will auto-increment from existing)
INSERT INTO products (pname, category, price, status, bought_year, preferred_for, no_of_copies) VALUES
-- Completed sales (past transactions)
('Operating Systems Concepts', 'Books', 550.00, 'sold', 2022, '3rd', 1),
('Database Management Systems', 'Books', 480.00, 'sold', 2023, '2nd', 1),
('Computer Networks', 'Books', 420.00, 'sold', 2023, '3rd', 1),
('Algorithm Design Manual', 'Books', 650.00, 'sold', 2022, '3rd', 1),
('Discrete Mathematics', 'Books', 380.00, 'sold', 2023, '2nd', 1),

-- Electronics - sold
('HP Laptop i5 8GB', 'Electronics', 32000.00, 'sold', 2022, '4th', 1),
('Wireless Mouse Logitech', 'Electronics', 450.00, 'sold', 2024, 'all', 1),
('USB-C Hub', 'Electronics', 1200.00, 'sold', 2023, 'all', 1),
('Portable SSD 500GB', 'Electronics', 4500.00, 'sold', 2023, '3rd', 1),
('Mechanical Keyboard', 'Electronics', 2800.00, 'sold', 2024, 'all', 1),

-- Gadgets - sold
('Smart Watch Fitbit', 'Gadgets', 5500.00, 'sold', 2023, 'all', 1),
('Bluetooth Speaker JBL', 'Gadgets', 1800.00, 'sold', 2024, 'all', 1),
('Power Bank 20000mAh', 'Gadgets', 1200.00, 'sold', 2024, 'all', 1),
('Earbuds Boat', 'Gadgets', 900.00, 'sold', 2024, 'all', 1),

-- Furniture - sold
('Study Table Wooden', 'Furniture', 3500.00, 'sold', 2022, 'all', 1),
('Office Chair Ergonomic', 'Furniture', 4200.00, 'sold', 2023, 'all', 1),
('Bookshelf Metal', 'Furniture', 2800.00, 'sold', 2023, 'all', 1),

-- Lab Equipment - sold
('Arduino Uno Kit', 'Equipments', 1500.00, 'sold', 2023, '2nd', 1),
('Oscilloscope Digital', 'Equipments', 8500.00, 'sold', 2022, '3rd', 1),
('Soldering Iron Kit', 'Equipments', 850.00, 'sold', 2024, '2nd', 1);

-- Get the starting PID for seller mapping
SET @start_pid = (SELECT MAX(pid) FROM products) - 19;

-- Map sellers to the new products
INSERT INTO product_seller (pid, sellerid) VALUES
(@start_pid + 0, 6),  -- OS Concepts
(@start_pid + 1, 7),  -- DBMS
(@start_pid + 2, 8),  -- Networks
(@start_pid + 3, 9),  -- Algorithms
(@start_pid + 4, 10), -- Discrete Math
(@start_pid + 5, 11), -- HP Laptop
(@start_pid + 6, 12), -- Mouse
(@start_pid + 7, 6),  -- USB Hub
(@start_pid + 8, 7),  -- SSD
(@start_pid + 9, 8),  -- Keyboard
(@start_pid + 10, 9), -- Smart Watch
(@start_pid + 11, 10), -- Speaker
(@start_pid + 12, 11), -- Power Bank
(@start_pid + 13, 12), -- Earbuds
(@start_pid + 14, 6), -- Study Table
(@start_pid + 15, 7), -- Office Chair
(@start_pid + 16, 8), -- Bookshelf
(@start_pid + 17, 9), -- Arduino
(@start_pid + 18, 10), -- Oscilloscope
(@start_pid + 19, 11); -- Soldering Kit

-- ===================================================================
-- STEP 3: Generate Historical Transaction Data (Past 90 Days)
-- ===================================================================

-- Completed Transactions (OTP verified - status: completed)
-- These represent successful sales over the past 3 months

-- January 2026 - 15 completed transactions
INSERT INTO transaction (buyerid, pid, quantity, status, time_of_purchase) VALUES
-- Week 1 Jan
(6, @start_pid + 0, 1, 'completed', '2026-01-05 10:30:00'),
(7, @start_pid + 5, 1, 'completed', '2026-01-06 14:20:00'),
(8, @start_pid + 14, 1, 'completed', '2026-01-07 16:45:00'),
(9, @start_pid + 10, 1, 'completed', '2026-01-08 11:15:00'),
(10, @start_pid + 6, 1, 'completed', '2026-01-09 09:30:00'),
-- Week 2 Jan
(11, @start_pid + 1, 1, 'completed', '2026-01-12 13:00:00'),
(12, @start_pid + 11, 1, 'completed', '2026-01-13 15:30:00'),
(6, @start_pid + 17, 1, 'completed', '2026-01-14 10:00:00'),
(7, @start_pid + 7, 1, 'completed', '2026-01-15 12:20:00'),
(8, @start_pid + 19, 1, 'completed', '2026-01-16 14:40:00'),
-- Week 3 Jan
(9, @start_pid + 2, 1, 'completed', '2026-01-19 11:30:00'),
(10, @start_pid + 12, 1, 'completed', '2026-01-20 16:00:00'),
(11, @start_pid + 8, 1, 'completed', '2026-01-21 10:45:00'),
(12, @start_pid + 15, 1, 'completed', '2026-01-22 13:15:00'),
(6, @start_pid + 13, 1, 'completed', '2026-01-23 15:30:00');

-- Week 4 Jan + Early Feb - 10 more transactions
INSERT INTO transaction (buyerid, pid, quantity, status, time_of_purchase) VALUES
(7, @start_pid + 3, 1, 'completed', '2026-01-26 09:00:00'),
(8, @start_pid + 9, 1, 'completed', '2026-01-27 14:30:00'),
(9, @start_pid + 16, 1, 'completed', '2026-01-28 11:00:00'),
(10, @start_pid + 4, 1, 'completed', '2026-01-29 16:15:00'),
(11, @start_pid + 18, 1, 'completed', '2026-01-30 10:30:00');

-- Recent week (Late Jan to Feb 2) - Mix of statuses for funnel
INSERT INTO transaction (buyerid, pid, quantity, status, time_of_purchase) VALUES
-- Completed (Feb 1-2)
(12, 2, 1, 'completed', '2026-02-01 10:00:00'),
(6, 7, 1, 'completed', '2026-02-01 14:30:00'),
(7, 4, 1, 'completed', '2026-02-02 11:15:00');

-- ===================================================================
-- STEP 4: Active/In-Progress Transactions (Conversion Funnel Data)
-- ===================================================================

-- Note: Status workflow is tracked in products table (reserved, location_selected, otp_generated)
-- Transaction table only has: pending, completed, cancelled

-- Create active transactions for products in different workflow stages
INSERT INTO transaction (buyerid, pid, quantity, status, time_of_purchase) VALUES
(8, 31, 1, 'pending', '2026-02-02 16:00:00'),
(9, 33, 1, 'pending', '2026-02-02 17:30:00'),
(10, 36, 1, 'pending', '2026-02-03 09:00:00'),
(11, 38, 1, 'pending', '2026-02-02 10:00:00'),
(12, 40, 1, 'pending', '2026-02-02 13:30:00'),
(6, 56, 1, 'pending', '2026-02-03 08:00:00'),
(7, 64, 1, 'pending', '2026-02-03 09:30:00'),
(8, 66, 1, 'pending', '2026-02-03 11:00:00'),
(9, 75, 1, 'pending', '2026-02-03 13:00:00');

-- Status: cancelled (various cancellation scenarios)
INSERT INTO transaction (buyerid, pid, quantity, status, time_of_purchase) VALUES
(10, 86, 1, 'cancelled', '2026-02-01 10:00:00'),
(11, 91, 1, 'cancelled', '2026-02-01 14:00:00'),
(12, 95, 1, 'cancelled', '2026-02-02 09:00:00');

-- Update product statuses to reflect workflow states
-- Products with pending transactions get marked as reserved, location_selected, or otp_generated
UPDATE products SET status = 'location_selected' WHERE pid = 31;
UPDATE products SET status = 'location_selected' WHERE pid = 33;
UPDATE products SET status = 'location_selected' WHERE pid = 36;
UPDATE products SET status = 'otp_generated' WHERE pid = 38;
UPDATE products SET status = 'otp_generated' WHERE pid = 40;
UPDATE products SET status = 'reserved' WHERE pid = 56;
UPDATE products SET status = 'reserved' WHERE pid = 64;
UPDATE products SET status = 'reserved' WHERE pid = 66;
UPDATE products SET status = 'reserved' WHERE pid = 75;

-- ===================================================================
-- STEP 5: OTP Verifications (for completed transactions)
-- ===================================================================

-- Note: otp_tokens table uses product_id, buyer_id, seller_id (not tid)
-- and stores hashed OTPs, not plaintext
-- For analytics purposes, we'll create OTP records for products in otp_generated status

-- Generate OTP records for products in otp_generated status (pids 38, 40)
INSERT INTO otp_tokens (product_id, buyer_id, seller_id, otp_hash, expires_at, used, created_at)
SELECT 
    38 as product_id,
    11 as buyer_id,
    (SELECT sellerid FROM product_seller WHERE pid = 38) as seller_id,
    '$2b$10$example_hash_123456' as otp_hash,
    DATE_ADD(NOW(), INTERVAL 15 MINUTE) as expires_at,
    0 as used,
    NOW() as created_at
WHERE EXISTS (SELECT 1 FROM products WHERE pid = 38);

INSERT INTO otp_tokens (product_id, buyer_id, seller_id, otp_hash, expires_at, used, created_at)
SELECT 
    40 as product_id,
    12 as buyer_id,
    (SELECT sellerid FROM product_seller WHERE pid = 40) as seller_id,
    '$2b$10$example_hash_654321' as otp_hash,
    DATE_ADD(NOW(), INTERVAL 15 MINUTE) as expires_at,
    0 as used,
    NOW() as created_at
WHERE EXISTS (SELECT 1 FROM products WHERE pid = 40);

-- ===================================================================
-- STEP 6: Reservation Cancellations (with reasons for analytics)
-- ===================================================================

-- reservation_cancellations table uses: pid, buyer_id, seller_id, cancelled_by, stage, reason
-- Get the PIDs and user IDs for cancelled transactions
INSERT INTO reservation_cancellations (pid, buyer_id, seller_id, cancelled_by, stage, is_pre_otp, reason, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    t.buyerid as cancelled_by,
    'reserved' as stage,
    1 as is_pre_otp,
    'changed_mind' as reason,
    '2026-02-01 11:30:00' as created_at
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'cancelled' AND t.pid = 86
LIMIT 1;

INSERT INTO reservation_cancellations (pid, buyer_id, seller_id, cancelled_by, stage, is_pre_otp, reason, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    t.buyerid as cancelled_by,
    'location_selected' as stage,
    0 as is_pre_otp,
    'seller_late' as reason,
    '2026-02-01 15:30:00' as created_at
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'cancelled' AND t.pid = 91
LIMIT 1;

INSERT INTO reservation_cancellations (pid, buyer_id, seller_id, cancelled_by, stage, is_pre_otp, reason, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    t.buyerid as cancelled_by,
    'reserved' as stage,
    1 as is_pre_otp,
    'bad_condition' as reason,
    '2026-02-02 10:00:00' as created_at
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'cancelled' AND t.pid = 95
LIMIT 1;

-- ===================================================================
-- STEP 7: Disputes (for quality/trust analytics)
-- ===================================================================

-- disputes table uses: pid, buyer_id, seller_id, reason, status, details, created_at
-- Note: There's no resolved_at or resolution column in the base schema

-- Resolved disputes
INSERT INTO disputes (pid, buyer_id, seller_id, reason, status, details, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    'Seller did not show up at agreed location',
    'resolved',
    'Refund issued. Seller penalized.',
    '2026-02-01 16:00:00'
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'cancelled' AND t.pid = 91
LIMIT 1;

INSERT INTO disputes (pid, buyer_id, seller_id, reason, status, details, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    'Product condition not as described',
    'resolved',
    'Partial refund issued.',
    '2026-01-28 14:00:00'
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'completed'
ORDER BY RAND()
LIMIT 1;

INSERT INTO disputes (pid, buyer_id, seller_id, reason, status, details, created_at)
SELECT 
    t.pid,
    t.buyerid,
    ps.sellerid,
    'Buyer damaged product during inspection',
    'resolved',
    'No action needed. Normal wear.',
    '2026-01-20 11:00:00'
FROM transaction t
JOIN product_seller ps ON t.pid = ps.pid
WHERE t.status = 'completed'
ORDER BY RAND()
LIMIT 1;

-- Open disputes
INSERT INTO disputes (pid, buyer_id, seller_id, reason, status, details, created_at)
VALUES
(38, 11, (SELECT sellerid FROM product_seller WHERE pid = 38), 'Waiting too long for seller confirmation', 'open', 'Buyer has been waiting for 2 days', '2026-02-03 10:00:00'),
(31, 8, (SELECT sellerid FROM product_seller WHERE pid = 31), 'Buyer unresponsive to messages', 'open', 'Seller attempted contact 3 times', '2026-02-03 12:00:00');

-- ===================================================================
-- STEP 8: Chat Messages (activity data) - SKIPPED
-- ===================================================================
-- Note: Chat messages table structure not confirmed in schema
-- This can be added later if needed

-- ===================================================================
-- STEP 9: Wishlist Activity (engagement metrics)
-- ===================================================================

-- Add wishlist entries for available products
INSERT IGNORE INTO add_to_wishlist (uid, pid) VALUES
-- Popular items (multiple wishlists)
(6, 1), (7, 1), (8, 1), (9, 1), -- Scientific Calculator
(6, 31), (7, 31), (10, 31), -- Laptop
(11, 33), (12, 33), (6, 33), -- Textbook
(7, 56), (8, 56), (9, 56), (10, 56), -- Gadget
(11, 86), (12, 86), -- Furniture

-- Moderate interest
(6, 5), (7, 5),
(8, 36), (9, 36),
(10, 64), (11, 64),
(12, 75), (6, 75);

-- ===================================================================
-- STEP 10: User Activity Stats (gamification data)
-- ===================================================================

-- Update trust points based on transaction behavior
UPDATE users SET trust_points = trust_points + 10 WHERE uid IN (
    SELECT DISTINCT buyerid FROM transaction WHERE status = 'completed'
);

UPDATE users SET trust_points = trust_points + 15 WHERE uid IN (
    SELECT DISTINCT ps.sellerid 
    FROM transaction t 
    JOIN product_seller ps ON t.pid = ps.pid 
    WHERE t.status = 'completed'
);

-- Penalize users with cancelled transactions (buyer fault)
UPDATE users SET trust_points = trust_points - 5 WHERE uid IN (
    SELECT DISTINCT rc.cancelled_by 
    FROM reservation_cancellations rc 
    WHERE rc.reason = 'changed_mind'
);

-- ===================================================================
-- STEP 11: Admin Activity Log (moderation data) - SKIPPED
-- ===================================================================
-- Note: Admin actions are logged in admin_actions_log table
-- This seed focuses on transaction and product data

-- ===================================================================
-- Summary Statistics
-- ===================================================================

SELECT 'Analytics Seed Data Summary' as report;

SELECT 
    '✓ Total Users' as metric,
    COUNT(*) as value
FROM users;

SELECT 
    '✓ Total Products' as metric,
    COUNT(*) as value
FROM products;

SELECT 
    '✓ Total Transactions' as metric,
    COUNT(*) as value
FROM transaction;

SELECT 
    '✓ Completed Transactions' as metric,
    COUNT(*) as value
FROM transaction WHERE status = 'completed';

SELECT 
    '✓ Active Transactions' as metric,
    COUNT(*) as value
FROM transaction WHERE status = 'pending';

SELECT 
    '✓ Cancelled Transactions' as metric,
    COUNT(*) as value
FROM transaction WHERE status = 'cancelled';

SELECT 
    '✓ Total OTP Verifications' as metric,
    COUNT(*) as value
FROM otp_tokens;

SELECT 
    '✓ Open Disputes' as metric,
    COUNT(*) as value
FROM disputes WHERE status = 'open';

SELECT 
    '✓ Wishlist Entries' as metric,
    COUNT(*) as value
FROM add_to_wishlist;

SELECT '🎉 Analytics seed data created successfully!' as status;
SELECT 'Dashboard now has rich data for visualization and trend analysis.' as message;

-- ===================================================================
-- END OF ANALYTICS SEED
-- ===================================================================
