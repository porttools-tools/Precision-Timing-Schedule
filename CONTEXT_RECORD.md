# PTS — Context record (living document)

**Purpose:** Quick snapshot of repo state and near-term work. **Authoritative detail:** `MEMORY_BANK.md`.

**Last updated:** 2026-03-25

## Current state

- **Delay calculator** and **delay codes** (picker, category filter, search, minutes → min remaining) are **implemented** in root `index.html` / `app.js` / `styles.css` / **`delay-codes-data.js`**.
- **Mobile:** coarse-pointer detection skips immediate `focus()` on picker search and on new code-row minutes after pick; deploy **all** JS/CSS and **`delay-codes-data.js`** together.

## When changing delay codes

1. Edit **`Delay Code Summary.csv`** (or replace file).
2. Regenerate **`delay-codes-data.js`** (`scripts/gen-delay-codes.js` or Python with correct CSV encoding).
3. Upload regenerated file with the site.

## Possible follow-ups (if user wants)

- Persist delay calculator state (localStorage) across refresh.
- Analytics / export of delay + codes.
- Inline embed of codes in a single bundle instead of separate `delay-codes-data.js` (trade-off: larger `app.js`).

## How to use these files

1. **`MEMORY_BANK.md`** — architecture, data model, delay/codes behaviour, deployment notes.
2. **`CONTEXT_RECORD.md`** — what’s done recently and loose next steps.
3. Update **`CONTEXT_RECORD.md`** after meaningful milestones.
