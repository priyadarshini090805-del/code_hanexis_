# Run Locally (SQLite — no internet, no setup)

Run the whole app on a laptop with **zero external services** — no Neon, no
Postgres, no Docker. Uses a local SQLite file database.

## Prerequisites
- [Node.js 20+](https://nodejs.org) installed (one-time)

## Easiest: one-click launcher
- **Windows:** double-click **`START-WINDOWS.bat`**
- **macOS:** double-click **`START-MAC.command`**
- **Linux:** run **`bash START-LINUX.sh`**

It installs everything on first run, sets up the database, starts the app, and
opens your browser automatically. To stop, close the window. That's it.

> If Node.js isn't installed, the launcher tells you where to get it.

## Or run manually

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Create the local SQLite database + seed demo data
npm run setup:local

# 3. Start the app
npm run dev:local
```

Open **http://localhost:3000**

## Demo login
```
Email:    demo@demo.com
Password: Demo@1234
```
(This account is an ADMIN, so the Audit page works too.)

The seed also creates 5 sample leads and a demo campaign so the dashboard
looks populated.

## Notes
- The database is a single file at `prisma/dev.db`. Delete it and re-run
  `npm run setup:local` to start fresh.
- AI message generation works offline using built-in templates. To use the
  real AI model, set `OPENROUTER_API_KEY` in `.env.local`.
- Email sending and live social publishing need API keys and are not required
  for the local demo.
- If you re-run `npm install`, run `npm run setup:local` again (install
  regenerates the Postgres client; this switches it back to SQLite).

## Production note
The deployed (Vercel) version still uses PostgreSQL via `prisma/schema.prisma`.
This local mode uses `prisma/schema.sqlite.prisma` — the application code is
identical and works with both.
