# Turnaround Calculator (Web App)

Precision Timing Schedule (PTS) for aircraft turnaround times. Enter one time (HH:MM) and the rest are calculated from the schedule. Schedules are stored in **Supabase** and shared for all users. Admin mode (password-protected) allows creating and editing schedules.

## Run locally

1. Open the project folder in a terminal.
2. Serve the folder with any static server, or open the file directly:

   **Option A — Open file in browser**  
   Double‑click `index.html` or drag it into a browser. Some browsers may restrict scripts when opening `file://`; if things don’t work, use Option B.

   **Option B — Simple HTTP server (recommended)**  
   With Python 3:
   ```bash
   python -m http.server 8000
   ```
   Then open: http://localhost:8000

   With Node.js (npx):
   ```bash
   npx serve .
   ```
   Then open the URL shown (e.g. http://localhost:3000).

## Supabase setup

The app uses Supabase for storing schedules. **Where to run SQL:** In the [Supabase Dashboard](https://supabase.com/dashboard), open your project → **SQL Editor** → New query.

### 1. Tables (if you haven’t created them yet)

Run this once to create the `aircraft` and `key_time` tables:

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schedules (app calls this "aircraft" in the API)
CREATE TABLE IF NOT EXISTS aircraft (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Times for each schedule
CREATE TABLE IF NOT EXISTS key_time (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  offset_minutes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  is_key_time BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow the app to read/write (anon key). Tighten for production if needed.
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on aircraft" ON aircraft FOR SELECT USING (true);
CREATE POLICY "Allow public insert on aircraft" ON aircraft FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on aircraft" ON aircraft FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on aircraft" ON aircraft FOR DELETE USING (true);

CREATE POLICY "Allow public read on key_time" ON key_time FOR SELECT USING (true);
CREATE POLICY "Allow public insert on key_time" ON key_time FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on key_time" ON key_time FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on key_time" ON key_time FOR DELETE USING (true);
```

### 2. If tables already exist: add key time highlighting

If you only need the “key time” (red border) column, run:

```sql
ALTER TABLE key_time ADD COLUMN IF NOT EXISTS is_key_time BOOLEAN DEFAULT false;
```

## Usage

- **Landing:** Open a schedule from the list (or use **Admin** to create/edit).
- **Main screen:** Enter a 24‑hour time (e.g. `14:30`) in any row; the rest update. The row you typed in is highlighted (red left border). Rows marked as key times show a red border.
- **Admin:** Click **Admin** in the header (landing only), enter password → **Edit Schedule** and **+ New schedule** appear. Click **Exit Admin** to lock the app again.
- **Edit schedule:** In admin, open a schedule → **Edit Schedule** → change names/offsets, use **Key time** to flag rows (red border in schedule), then **Save**.
