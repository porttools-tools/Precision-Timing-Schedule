-- Rollback Script: Enhanced Schedule Features
-- Use this to undo the migration if needed
-- Date: 2026-03-11

-- Drop the schedule_metadata table
DROP TABLE IF EXISTS schedule_metadata;

-- Remove new columns from key_time table
ALTER TABLE key_time 
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS duration_minutes,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS is_conditional,
DROP COLUMN IF EXISTS category;

-- Done! Your database is back to its original structure.
-- All your existing schedule data (aircraft and key_time) remains intact.
