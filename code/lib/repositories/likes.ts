import type { PoolConnection, RowDataPacket } from "mysql2/promise"
import { query, queryOne, transaction } from "../db"

interface NovelLikeRow extends RowDataPacket {
  user_id: number
  novel_id: number
}

interface NovelRow extends RowDataPacket {
  likes: number
}

export interface LikedNovelRow extends RowDataPacket {
  user_id: number
  novel_id: number
  title: string
  description: string | null
  cover_image: string | null
  tags: string | null
  status: string
  views: number
  likes: number
  rating: number
  created_at: Date
  last_update: Date
  author_user_id: number | null
  author_username: string | null
}

async function selectNovelLike(connection: PoolConnection, userId: number, novelId: number): Promise<boolean> {
  const [rows] = await connection.query<NovelLikeRow[]>(
    "SELECT user_id, novel_id FROM novel_likes WHERE user_id = ? AND novel_id = ? LIMIT 1",
    [userId, novelId],
  )
  return rows.length > 0
}

async function selectNovelForUpdate(connection: PoolConnection, novelId: number): Promise<number> {
  const [rows] = await connection.query<NovelRow[]>(
    "SELECT likes FROM novels WHERE novel_id = ? FOR UPDATE",
    [novelId],
  )
  if (rows.length === 0) {
    throw new Error("Novel not found")
  }
  return Number(rows[0].likes ?? 0)
}

export async function toggleNovelLike(
  userId: number,
  novelId: number,
): Promise<{ action: "added" | "removed"; likes: number }> {
  return transaction(async (connection) => {
    const alreadyLiked = await selectNovelLike(connection, userId, novelId)
    const currentLikes = await selectNovelForUpdate(connection, novelId)

    if (alreadyLiked) {
      await connection.query("DELETE FROM novel_likes WHERE user_id = ? AND novel_id = ?", [userId, novelId])
      const nextLikes = Math.max(currentLikes - 1, 0)
      await connection.query("UPDATE novels SET likes = ? WHERE novel_id = ?", [nextLikes, novelId])
      return { action: "removed" as const, likes: nextLikes }
    }

    await connection.query("INSERT INTO novel_likes (user_id, novel_id) VALUES (?, ?)", [userId, novelId])
    const nextLikes = currentLikes + 1
    await connection.query("UPDATE novels SET likes = ? WHERE novel_id = ?", [nextLikes, novelId])
    return { action: "added" as const, likes: nextLikes }
  })
}

export async function hasUserLikedNovel(userId: number, novelId: number): Promise<boolean> {
  const row = await queryOne<RowDataPacket>(
    "SELECT 1 FROM novel_likes WHERE user_id = ? AND novel_id = ? LIMIT 1",
    [userId, novelId],
  )
  return Boolean(row)
}

export async function listLikedNovelsByUser(userId: number): Promise<LikedNovelRow[]> {
  return query<LikedNovelRow[]>(
    `SELECT nl.user_id, nl.novel_id,
            n.title, n.description, n.cover_image, n.tags, n.status,
            n.views, n.likes, n.rating,
            n.created_at, n.last_update,
            u.user_id AS author_user_id, u.username AS author_username
     FROM novel_likes nl
     JOIN novels n ON n.novel_id = nl.novel_id
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE nl.user_id = ?
     ORDER BY n.title ASC`,
    [userId],
  )
}
