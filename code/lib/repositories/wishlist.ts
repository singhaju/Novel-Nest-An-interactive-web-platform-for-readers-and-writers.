import type { RowDataPacket } from "mysql2/promise"
import { execute, getPool, query, queryOne } from "../db"

export interface WishlistRow extends RowDataPacket {
  user_id: number
  novel_id: number
  added_at: Date
  title: string
  description: string | null
  cover_image: string | null
  tags: string | null
  status: string
  views: number | null
  likes: number | null
  rating: number | null
  created_at: Date
  last_update: Date
  author_user_id: number | null
  author_username: string | null
  author_profile_picture: string | null
}

export async function listWishlistByUser(userId: number): Promise<WishlistRow[]> {
  return query<WishlistRow[]>(
    `SELECT uw.user_id, uw.novel_id, uw.added_at,
            n.title, n.description, n.cover_image, n.tags, n.status,
            n.views, n.likes, n.rating,
            n.created_at, n.last_update,
            a.user_id AS author_user_id, a.username AS author_username, a.profile_picture AS author_profile_picture
     FROM user_wishlist uw
     JOIN novels n ON n.novel_id = uw.novel_id
     LEFT JOIN users a ON a.user_id = n.author_id
     WHERE uw.user_id = ?
     ORDER BY uw.added_at DESC`,
    [userId],
  )
}

export async function isNovelInWishlist(userId: number, novelId: number): Promise<boolean> {
  const row = await queryOne<RowDataPacket>(
    `SELECT 1 FROM user_wishlist WHERE user_id = ? AND novel_id = ? LIMIT 1`,
    [userId, novelId],
  )
  return Boolean(row)
}

export async function addToWishlist(userId: number, novelId: number): Promise<void> {
  const pool = getPool()
  await pool.query("CALL AddToWishlist(?, ?)", [userId, novelId])
}

export async function removeFromWishlist(userId: number, novelId: number): Promise<void> {
  const pool = getPool()
  await pool.query("CALL RemoveFromWishlist(?, ?)", [userId, novelId])
}

export async function toggleWishlistEntry(userId: number, novelId: number): Promise<{ action: "added" | "removed" }> {
  const exists = await isNovelInWishlist(userId, novelId)
  if (exists) {
    await removeFromWishlist(userId, novelId)
    return { action: "removed" }
  }
  await addToWishlist(userId, novelId)
  return { action: "added" }
}
