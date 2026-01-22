-- OTP Tokens Table Migration
-- Creates table for storing hashed OTPs with security features

CREATE TABLE IF NOT EXISTS otp_tokens (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT false,
  failed_attempts INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(pid) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(uid),
  FOREIGN KEY (seller_id) REFERENCES users(uid),
  
  INDEX idx_product_id (product_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update product status enum to support reservation states
ALTER TABLE products MODIFY COLUMN status 
  ENUM('available', 'reserved', 'meet_confirmed', 'sold', 'inactive') 
  DEFAULT 'available';

-- Add reservation tracking columns
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS reserved_by INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reserved_at DATETIME DEFAULT NULL;

-- Add foreign key for reserved_by if it doesn't exist
ALTER TABLE products 
  ADD CONSTRAINT fk_products_reserved_by 
  FOREIGN KEY (reserved_by) REFERENCES users(uid)
  ON DELETE SET NULL;
