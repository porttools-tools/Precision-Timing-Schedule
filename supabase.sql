-- ============================================================
-- Run this in the Supabase SQL Editor
-- (Dashboard → your project → SQL Editor → New query)
-- ============================================================

-- 1) Tables (safe to run if already created)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS aircraft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offset_minutes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  is_key_time BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Key time column only (if tables exist but column is missing)
ALTER TABLE key_time ADD COLUMN IF NOT EXISTS is_key_time BOOLEAN DEFAULT false;

-- 3) RLS policies (run if you get permission errors)
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_time ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on aircraft" ON aircraft;
DROP POLICY IF EXISTS "Allow public insert on aircraft" ON aircraft;
DROP POLICY IF EXISTS "Allow public update on aircraft" ON aircraft;
DROP POLICY IF EXISTS "Allow public delete on aircraft" ON aircraft;
CREATE POLICY "Allow public read on aircraft" ON aircraft FOR SELECT USING (true);
CREATE POLICY "Allow public insert on aircraft" ON aircraft FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on aircraft" ON aircraft FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on aircraft" ON aircraft FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on key_time" ON key_time;
DROP POLICY IF EXISTS "Allow public insert on key_time" ON key_time;
DROP POLICY IF EXISTS "Allow public update on key_time" ON key_time;
DROP POLICY IF EXISTS "Allow public delete on key_time" ON key_time;
CREATE POLICY "Allow public read on key_time" ON key_time FOR SELECT USING (true);
CREATE POLICY "Allow public insert on key_time" ON key_time FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on key_time" ON key_time FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on key_time" ON key_time FOR DELETE USING (true);
