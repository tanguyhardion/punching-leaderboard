import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const host = process.env.PGHOST || process.env.POSTGRES_HOST
const user = process.env.PGUSER || process.env.POSTGRES_USER
const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD
const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE
const rawUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

const sql = (host && user && password && database)
  ? postgres({
      host,
      user,
      password,
      database,
      port: 5432,
      ssl: 'require',
    })
  : postgres(rawUrl || '', {
      ssl: 'require',
    })

const scoresData = [
  {
    id: '36113348-a927-4179-b4d3-3aca4ac96d00',
    player: 'LeStagiaire',
    score: 350,
    power: 'Homosexual Simulation Punch',
    created_at: '2026-07-21 11:40:00.609511+00',
  },
  {
    id: '5a0a2ab2-b349-4867-882c-f14dbb97fbeb',
    player: 'William',
    score: 715,
    power: 'Paf',
    created_at: '2026-07-23 11:44:21.976467+00',
  },
  {
    id: '6a46ec41-5dda-45d8-b356-b84b3d49f965',
    player: 'Joan',
    score: 317,
    power: 'Deception',
    created_at: '2026-07-23 11:43:49.689731+00',
  },
  {
    id: '8cc5d92d-84e8-4674-97b4-43df962001f0',
    player: 'William',
    score: 662,
    power: 'Poutrage',
    created_at: '2026-07-21 11:18:25.095337+00',
  },
  {
    id: 'a41820d7-09ac-4f6c-94e8-0d5a7b6c98e8',
    player: 'Tanguy',
    score: 578,
    power: 'Pipal',
    created_at: '2026-07-23 11:46:20.449572+00',
  },
  {
    id: 'ac64432e-e4f7-49f5-8675-325fd0e05242',
    player: 'Tanguy',
    score: 546,
    power: 'Shitload',
    created_at: '2026-07-21 11:20:19.567542+00',
  },
  {
    id: 'e360cba9-f6ab-44eb-bde2-eb7410811f14',
    player: 'Nicolas',
    score: 537,
    power: 'Arcade Smash',
    created_at: '2026-07-21 11:19:23.797657+00',
  },
  {
    id: 'f35c4b12-8b4d-4f90-850d-efdc9b574a65',
    player: 'Nicolas',
    score: 738,
    power: 'Client’s meeting',
    created_at: '2026-07-23 11:42:59.972104+00',
  },
]

async function migrate() {
  console.log('Connecting to Neon DB...')
  
  // Ensure table exists
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

  console.log('Inserting rows into public.scores...')
  for (const item of scoresData) {
    await sql`
      INSERT INTO public.scores (id, player, score, power, created_at)
      VALUES (${item.id}, ${item.player}, ${item.score}, ${item.power}, ${item.created_at})
      ON CONFLICT (id) DO UPDATE SET
        player = EXCLUDED.player,
        score = EXCLUDED.score,
        power = EXCLUDED.power,
        created_at = EXCLUDED.created_at
    `
    console.log(`✓ Inserted / Updated: ${item.player} - ${item.score} (${item.id})`)
  }

  const allScores = await sql`SELECT count(*) as count FROM public.scores`
  console.log(`Total scores in database: ${allScores[0].count}`)
  await sql.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
