-- RBAC Migration: Add role column to users table
-- Run this after schema.sql and before seed.sql

-- Add role column with default 'user'
ALTER TABLE users 
ADD COLUMN role ENUM('user', 'admin', 'moderator') DEFAULT 'user' AFTER password;

-- Add index for role-based queries
CREATE INDEX idx_users_role ON users(role);
