-- Add meeting_time column to prod_loc table
USE campuskart;

ALTER TABLE prod_loc
ADD COLUMN meeting_time VARCHAR(100) DEFAULT NULL;

-- Verify change
DESCRIBE prod_loc;
