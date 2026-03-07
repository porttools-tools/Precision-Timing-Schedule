# Turnaround Calculator (Web App)

Aircraft turnaround time calculator for the **Dash 8-400 25min Turn** DEPARTURE schedule. Enter one phase time (HH:MM) and the rest are calculated from the schedule. Edit phase names and offsets (minutes before off blocks) on the schedule edit screen; your schedule is saved in the browser (localStorage).

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

## Usage

- **Main screen:** Enter a 24‑hour time (e.g. `14:30`) in any phase; the other times update from the schedule. The phase you typed in is highlighted (red left border).
- **Edit schedule:** Click **Edit schedule**, change phase names and offset minutes (negative = before off blocks), then **Save**. The schedule is stored in your browser for next time.
