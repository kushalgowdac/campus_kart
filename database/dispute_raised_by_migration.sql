-- Add raised_by and raised_role to disputes for buyer/seller reporting
-- Compatible with MySQL versions that don't support IF NOT EXISTS on ADD COLUMN

SET @has_raised_by := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'raised_by'
);

SET @has_raised_role := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND COLUMN_NAME = 'raised_role'
);

SET @has_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'disputes'
    AND INDEX_NAME = 'idx_dispute_raised_by'
);

SET @sql_add_raised_by = IF(@has_raised_by = 0,
  'ALTER TABLE disputes ADD COLUMN raised_by INT NULL AFTER seller_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_raised_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_add_raised_role = IF(@has_raised_role = 0,
  'ALTER TABLE disputes ADD COLUMN raised_role VARCHAR(20) NULL AFTER raised_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_raised_role;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_add_idx = IF(@has_idx = 0,
  'ALTER TABLE disputes ADD INDEX idx_dispute_raised_by (raised_by)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill existing rows (optional): assume buyer raised if unknown
UPDATE disputes
SET raised_by = buyer_id,
    raised_role = 'buyer'
WHERE raised_by IS NULL;
