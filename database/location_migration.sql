-- Location Selection Workflow Migration
-- Extends the OTP workflow to include location proposal and selection

USE campuskart;

-- Add selection flag to prod_loc table
ALTER TABLE prod_loc
ADD COLUMN is_selected BOOLEAN DEFAULT false;

-- Extend products status enum to include new workflow states
ALTER TABLE products 
MODIFY COLUMN status ENUM(
  'available',
  'sold', 
  'inactive',
  'reserved',
  'location_proposed',
  'location_selected',
  'meet_confirmed',
  'otp_generated'
) DEFAULT 'available';

-- Verify changes
DESCRIBE prod_loc;
SHOW COLUMNS FROM products WHERE Field = 'status';
