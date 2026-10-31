import { defineEventHandler, readBody, createError } from 'h3'
import { sql, ensureDb } from '../utils/db'
import { requireSubmitPassword } from '../utils/auth'

export default defineEventHandler(async (event) => {
  requireSubmitPassword(event, 'POST /api/scores')

  try {
    const body = await readBody(event)
    const { player, score, power } = body ?? {}

    // Input validation
    if (typeof player !== 'string' || player.trim().length === 0 || player.trim().length > 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'player must be a non-empty string (max 20 chars).',
      })
    }

    const parsedScore = Number(score)
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 999) {
      throw createError({
        statusCode: 400,
        statusMessage: 'score must be an integer between 1 and 999.',
      })
    }

    const sanitizedPower =
      typeof power === 'string' && power.trim().length > 0
        ? power.trim().slice(0, 28)
        : 'Arcade Smash'

    await ensureDb()

    // Parameterized insert
    const rows = await sql`
      INSERT INTO public.scores (player, score, power)
      VALUES (${player.trim()}, ${parsedScore}, ${sanitizedPower})
      RETURNING id, player, score, power, created_at
    `

    const data = rows[0]
    return {
      id: data.id,
      player: data.player,
      score: data.score,
      power: data.power,
      createdAt: data.created_at,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[POST /api/scores] Error saving score:', err.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error.',
    })
  }
})
