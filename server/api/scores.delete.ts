import { defineEventHandler, getQuery, createError } from 'h3'
import { sql, ensureDb } from '../utils/db'
import { requireSubmitPassword } from '../utils/auth'

export default defineEventHandler(async (event) => {
  requireSubmitPassword(event, 'DELETE /api/scores')

  try {
    const query = getQuery(event)
    const { id } = query ?? {}

    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'id must be a valid UUID.',
      })
    }

    await ensureDb()

    // Parameterized delete
    const rows = await sql`
      DELETE FROM public.scores
      WHERE id = ${id}
      RETURNING id, player, score, power, created_at
    `

    const deletedRow = rows && rows.length > 0 ? rows[0] : null
    if (!deletedRow) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Score not found.',
      })
    }

    return {
      id: deletedRow.id,
      player: deletedRow.player,
      score: deletedRow.score,
      power: deletedRow.power,
      createdAt: deletedRow.created_at,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[DELETE /api/scores] Error deleting score:', err.message || err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error.',
    })
  }
})
