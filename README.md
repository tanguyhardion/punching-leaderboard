# Punching Machine Leaderboard

Nuxt 4 app backed by Postgres (Neon), deployed on Vercel.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

## Environment variables

- `SUBMIT_PASSWORD` – required to POST/DELETE scores (sent as `x-submit-password`).
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (optional `PGPORT`) or `POSTGRES_URL`/`DATABASE_URL`.
- `PG_POOL_MAX` – optional pool size (default 3).

The `public.scores` table is created automatically on first request.

## Scripts

- `npm run build` / `npm run preview` – production build and preview.
- `npm run import-scores` – seed/upsert historical scores (see `scripts/import-scores.mjs`, `scores_rows.csv`).
