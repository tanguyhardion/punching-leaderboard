import { defineEventHandler } from 'h3'
import { sql, ensureDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await ensureDb()

    const rows = await sql`
      SELECT id, player, score, power, created_at
      FROM public.scores
      ORDER BY score DESC
      LIMIT 200
    `

    return rows.map((row: any) => ({
      id: row.id,
      player: row.player,
      score: row.score,
      power: row.power,
      createdAt: row.created_at,
    }))
  } catch (err: any) {
    console.error('[GET /api/scores] Error fetching scores:', err.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve scores.',
    })
  }
})
