-- Migration to add reschedule request tracking
ALTER TABLE products ADD COLUMN reschedule_requested_by INT DEFAULT NULL;
