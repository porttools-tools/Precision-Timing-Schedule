# Turnaround Calculator (Web App)

Precision Timing Schedule (PTS): a web app for viewing and calculating turnaround key times. Schedules are stored in **Supabase** and shared for all users.

## Basic functionality

- **Landing page** — Lists all schedules. Tap or click a schedule to open it.
- **Schedule view** — Each schedule shows a list of key times with name and offset. Enter one time (24-hour, e.g. HH:MM) in any row; the app calculates and fills the rest. The row you edit is highlighted; rows marked as key times show a red border.
- **Admin mode** — A password-protected mode (available from the landing page) unlocks **Edit Schedule** and **+ New schedule**. In admin you can create schedules, edit names and offsets, add or remove key time rows, and mark which rows are "key times" (red border). Exit admin to return to view-only for those actions.
- **Responsive layout** — On small screens the main title is hidden except on the landing page to save space.
