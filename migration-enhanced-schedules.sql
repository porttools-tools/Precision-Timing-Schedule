-- Migration: Enhanced Schedule Features
-- Adds support for departments, durations, notes, categories, and metadata
-- Date: 2026-03-11

-- Add new columns to key_time table
ALTER TABLE key_time 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_conditional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create schedule_metadata table for version control and general notes
CREATE TABLE IF NOT EXISTS schedule_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aircraft_id UUID REFERENCES aircraft(id) ON DELETE CASCADE UNIQUE,
  version TEXT,
  turn_time TEXT,
  description TEXT,
  general_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on schedule_metadata
ALTER TABLE schedule_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schedule_metadata (public CRUD like other tables)
CREATE POLICY "Public can view schedule_metadata" 
  ON schedule_metadata FOR SELECT 
  USING (true);

CREATE POLICY "Public can insert schedule_metadata" 
  ON schedule_metadata FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Public can update schedule_metadata" 
  ON schedule_metadata FOR UPDATE 
  USING (true);

CREATE POLICY "Public can delete schedule_metadata" 
  ON schedule_metadata FOR DELETE 
  USING (true);

-- Comments for documentation
COMMENT ON COLUMN key_time.department IS 'Responsible department/party (e.g., Engineering, GSP, Cabin Crew)';
COMMENT ON COLUMN key_time.duration_minutes IS 'How long this task takes to complete';
COMMENT ON COLUMN key_time.notes IS 'Task-specific notes or instructions';
COMMENT ON COLUMN key_time.is_conditional IS 'True if task is conditional (e.g., first flight only)';
COMMENT ON COLUMN key_time.category IS 'Task category for grouping (e.g., Passenger Services, Engineering)';
