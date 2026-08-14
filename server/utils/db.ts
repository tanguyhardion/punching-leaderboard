import postgres from 'postgres'

// Use explicit PG* vars (always present after `vercel env pull`) — avoids URL
// parsing issues with libpq-only params like channel_binding.
// Falls back to parsing POSTGRES_URL if individual vars aren't set.
const host     = process.env.PGHOST     || process.env.POSTGRES_HOST
const user     = process.env.PGUSER     || process.env.POSTGRES_USER
const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD
const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE
const rawUrl   = process.env.POSTGRES_URL || process.env.DATABASE_URL

const hasExplicitVars = host && user && password && database

export const sql = hasExplicitVars
  ? postgres({
      host,
      user,
      password,
      database,
      port: 5432,
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : postgres(rawUrl || '', {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })


let dbInitialized = false

export async function ensureDb() {
  if (dbInitialized) return
  if (!hasExplicitVars && !rawUrl) {
    console.warn('No DB credentials found. Set PGHOST/PGUSER/PGPASSWORD/PGDATABASE or POSTGRES_URL.')
    return
  }

  try {
    // Ensure the pg_crypto extension is loaded (needed for gen_random_uuid on older PG, standard on 13+)
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
  } catch (e) {
    // Might fail if not superuser, continue anyway as gen_random_uuid is often built-in or already enabled
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.scores (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player     TEXT NOT NULL CHECK (char_length(player) BETWEEN 1 AND 20),
        score      INTEGER NOT NULL CHECK (score BETWEEN 1 AND 999),
        power      TEXT NOT NULL DEFAULT 'Arcade Smash' CHECK (char_length(power) <= 28),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `
    await sql`
      CREATE INDEX IF NOT EXISTS scores_score_desc_idx ON public.scores (score DESC)
    `
    dbInitialized = true
    console.log('Database initialized successfully (public.scores table created/verified).')
  } catch (err: any) {
    console.error('Failed to initialize database table:', err.message || err)
    throw err
  }
}
