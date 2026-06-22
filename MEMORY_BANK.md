# PTS — Memory bank (stable reference)

Single place for **long-lived** project facts. For a short “where we are now,” see `CONTEXT_RECORD.md`.

## What this project is

- **Precision Timing Schedule (PTS)** — turnaround key-time calculator: static **HTML + CSS + vanilla JS**, data in **Supabase** (`aircraft`, `key_time`; optional `schedule_metadata`).
- **Canonical app files** in **repo root**: `index.html`, `app.js`, `styles.css`, `delay-codes-data.js`, `manifest.json`, `icons/`.
- **Source data:** `Delay Code Summary.csv` — regenerate `delay-codes-data.js` with `scripts/gen-delay-codes.js` (Node) or Python (CSV often **cp1252** on Windows).

## Paths to ignore (see `.cursorignore`)

- **`Backup PTS/`** — Local backup; **not** source of truth. Do not merge from it unless the user asks.

## Architecture (enhanced build)

- **Landing:** schedule cards; **favorites** (localStorage); **draft vs live** via `aircraft.is_live`.
- **Header:** filter All/Favorites, Back, Grouped/Ungrouped, schedule name pill, Admin.
- **Schedule view:** **department filter** chips; **grouped** (one HHMM input per offset) vs **ungrouped**; **key times**; task **notes**; anchor uses **offset** when grouped, **data-index** when ungrouped.
- **Admin:** password gate; Edit Schedule / New schedule; live toggle; `schedule_metadata` notes.
- **Mobile:** `#focusSink` after Enter on timeline; delay picker avoids auto-**focus** on search/minutes when `(pointer: coarse)` so the keyboard doesn’t hide the UI; `touch-action: manipulation` on key delay controls.

## Delay calculator (`#delayScreen`)

- **Entry:** main screen button **“Delay calculator”** (`#delayHelperBtn`).
- **Fields:** Scheduled / Actual departure (HHMM); **Total delay (min)**; **IMSP LATAC**; **Min remaining** = total delay − LATAC − sum of **Minutes** on added delay codes.
- **Blocks off:** `key_time.is_blocks_off` (at most one per schedule in UI). Loaded with **`dbBoolTrue()`** so non-strict booleans from PostgREST still work. Timeline inputs use **`data-blocks-off="true"`**; **`getCarriedActualDeparture()`** prefers that attribute. Hint text does **not** mention edit mode.
- **Layout:** Centered column; delay inputs **~1.2rem**; **Total delay** / **Min remaining** **~1.48rem** (slightly larger).
- **Navigation:** Back from delay → schedule; from delay **code picker** → delay screen (not landing).

## Delay codes

- **`delay-codes-data.js`:** defines `window.DELAY_CODES` `[{ code, description, category }, …]`. **Required for picker** — deploy next to `index.html` (PC vs mobile issues were often **missing file** or **focus**; not SQL).
- **Picker (`#delayCodePickerScreen`):** **Category** dropdown (All + distinct categories), **Search** (tokenized, matches code/description/category). Tap row → return to calculator with a **card** (code + description + **Minutes**; no category on card). **×** removes row.
- **Regenerate data:** `node scripts/gen-delay-codes.js` (if Node available).

## Data model (high level)

- **`aircraft`:** `id`, `name`, `is_live`, …
- **`key_time`:** includes `is_key_time`, **`is_blocks_off`**, `department`, `duration_minutes`, `notes`, `is_conditional`, `category`, … — see `migration-enhanced-schedules.sql`.
- **`schedule_metadata`:** general notes per schedule.

SQL: `supabase.sql`, `migration-enhanced-schedules.sql`. Production columns must match.

## Secrets and config

- **Supabase URL/anon key** and **admin password** live in `app.js` — do not paste into markdown; rotate if leaked.

## Product rules (agreed)

- **No** visible “blocks off” marker on the main timeline — metadata for the calculator only.
- Delay code **Minutes** label (not “minutes to subtract”); added code **number** styled **black** so it isn’t confused with red delay totals.

## Duplicate folders

Nested `Precision-Timing-Schedule-*` zips may exist; **root** is canonical unless the user says otherwise.
