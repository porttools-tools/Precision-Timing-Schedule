# How to Import B787 Test Schedule

## Step 1: Create the Schedule
1. Open your Supabase dashboard SQL Editor
2. Copy **ONLY** this line from `import-b787-test.sql`:
   ```sql
   INSERT INTO aircraft (name) 
   VALUES ('B787 International - 90min Turn')
   RETURNING id;
   ```
3. Run it
4. **COPY THE UUID** that is returned (something like: `a1b2c3d4-e5f6-...`)

## Step 2: Import All the Tasks
1. Open `import-b787-test.sql` in a text editor
2. Use Find & Replace:
   - Find: `AIRCRAFT_ID_HERE`
   - Replace with: **[paste the UUID from Step 1]**
3. Copy the entire INSERT INTO key_time statement (starts after "STEP 2" comment)
4. Paste and run it in Supabase SQL Editor

## Step 3: Test in the App
1. Open index.html in your browser
2. The "B787 International - 90min Turn" schedule should appear in the list
3. Open it and click "Edit Schedule" (admin mode)
4. Click the ▼ button next to any task to see the enhanced fields:
   - Department
   - Duration
   - Category
   - Notes
   - Conditional checkbox

## What to Expect
The B787 schedule has:
- **55 tasks** (from -180 min to 0)
- **Departments** assigned (Engineering, GSP, Cabin Crew, etc.)
- **Durations** for some tasks (10min, 12min, 30min, etc.)
- **Categories** to group related tasks
- **Notes** on specific tasks
- **Key times** marked with red borders

This will be your comprehensive test case!
