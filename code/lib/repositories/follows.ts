import type { RowDataPacket } from "mysql2/promise"
import { getPool, query, queryOne } from "../db"

export interface FollowRow extends RowDataPacket {
  follower_id: number
  following_id: number
}

export interface FollowingAuthorRow extends RowDataPacket {
  follower_id: number
  following_id: number
  followed_at: Date
  user_id: number | null
  username: string | null
  profile_picture: string | null
  bio: string | null
}

export async function isFollowingAuthor(followerId: number, followingId: number): Promise<boolean> {
  const row = await queryOne<RowDataPacket>(
    `SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ? LIMIT 1`,
    [followerId, followingId],
  )
  return Boolean(row)
}

export async function followAuthor(followerId: number, followingId: number): Promise<void> {
  const pool = getPool()
  await pool.query("CALL FollowAuthor(?, ?)", [followerId, followingId])
}

export async function unfollowAuthor(followerId: number, followingId: number): Promise<void> {
  const pool = getPool()
  await pool.query("CALL UnfollowAuthor(?, ?)", [followerId, followingId])
}

export async function toggleFollow(followerId: number, followingId: number): Promise<{ action: "followed" | "unfollowed" }> {
  const exists = await isFollowingAuthor(followerId, followingId)
  if (exists) {
    await unfollowAuthor(followerId, followingId)
    return { action: "unfollowed" }
  }
  await followAuthor(followerId, followingId)
  return { action: "followed" }
}

export async function listFollowingAuthors(followerId: number): Promise<FollowingAuthorRow[]> {
  return query<FollowingAuthorRow[]>(
    `SELECT uf.follower_id, uf.following_id, uf.followed_at,
            u.user_id, u.username, u.profile_picture, u.bio
     FROM user_follows uf
     LEFT JOIN users u ON u.user_id = uf.following_id
     WHERE uf.follower_id = ?
     ORDER BY uf.followed_at DESC`,
    [followerId],
  )
}
