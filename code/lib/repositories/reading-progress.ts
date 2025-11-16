import type { RowDataPacket } from "mysql2/promise"
import { getPool, query, queryOne, execute } from "../db"

export interface ReadingProgressRow extends RowDataPacket {
  user_id: number
  novel_id: number
  last_read_episode_id: number
  updated_at: Date
}

export interface ReadingProgressWithNovelRow extends ReadingProgressRow {
  novel_title: string | null
}

export async function updateReadingProgress(
  userId: number,
  novelId: number,
  episodeId: number,
): Promise<ReadingProgressRow | null> {
  const pool = getPool()
  await pool.query("CALL UpdateReadingProgress(?, ?, ?)", [userId, novelId, episodeId])
  return queryOne<ReadingProgressRow>(
    `SELECT user_id, novel_id, last_read_episode_id, updated_at
     FROM user_reading_progress
     WHERE user_id = ? AND novel_id = ?`,
    [userId, novelId],
  )
}

export async function upsertReadingProgress(
  userId: number,
  novelId: number,
  episodeId: number,
): Promise<void> {
  await execute(
    `INSERT INTO user_reading_progress (user_id, novel_id, last_read_episode_id, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE last_read_episode_id = VALUES(last_read_episode_id), updated_at = NOW()`,
    [userId, novelId, episodeId],
  )
}

export async function listReadingProgressByUser(userId: number): Promise<ReadingProgressWithNovelRow[]> {
  return query<ReadingProgressWithNovelRow[]>(
    `SELECT urp.user_id, urp.novel_id, urp.last_read_episode_id, urp.updated_at,
            n.title AS novel_title
     FROM user_reading_progress urp
     LEFT JOIN novels n ON n.novel_id = urp.novel_id
     WHERE urp.user_id = ?
     ORDER BY urp.updated_at DESC`,
    [userId],
  )
}
