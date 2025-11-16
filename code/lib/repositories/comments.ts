import type { RowDataPacket } from "mysql2/promise"
import { execute, query, queryOne } from "../db"

export interface CommentRow extends RowDataPacket {
  comment_id: number
  episode_id: number
  user_id: number
  parent_comment_id: number | null
  content: string
  created_at: Date
}

export interface CommentWithUserRow extends CommentRow {
  username: string | null
  profile_picture: string | null
}

export interface CommentWithRelationsRow extends RowDataPacket {
  comment_id: number
  episode_id: number
  user_id: number
  parent_comment_id: number | null
  content: string
  created_at: Date
  username: string | null
  profile_picture: string | null
}

export async function deleteCommentsByEpisode(episodeId: number): Promise<void> {
  await execute("DELETE FROM comments WHERE episode_id = ?", [episodeId])
}

export async function findCommentById(commentId: number): Promise<CommentRow | null> {
  return queryOne<CommentRow>("SELECT * FROM comments WHERE comment_id = ?", [commentId])
}

export async function listEpisodeComments(episodeId: number): Promise<CommentWithUserRow[]> {
  return query<CommentWithUserRow[]>(
    `SELECT c.*, u.username, u.profile_picture
     FROM comments c
     LEFT JOIN users u ON u.user_id = c.user_id
     WHERE c.episode_id = ?
     ORDER BY c.created_at ASC`,
    [episodeId],
  )
}

export async function listCommentsForEpisode(episodeId: number): Promise<CommentWithRelationsRow[]> {
  return query<CommentWithRelationsRow[]>(
    `SELECT c.comment_id, c.episode_id, c.user_id, c.parent_comment_id, c.content, c.created_at,
            u.username, u.profile_picture
     FROM comments c
     LEFT JOIN users u ON u.user_id = c.user_id
     WHERE c.episode_id = ?
     ORDER BY c.created_at DESC`,
    [episodeId],
  )
}

export async function createComment(data: {
  episode_id: number
  user_id: number
  content: string
  parent_comment_id?: number | null
}): Promise<CommentWithUserRow> {
  const result = await execute(
    `INSERT INTO comments (episode_id, user_id, content, parent_comment_id)
     VALUES (?, ?, ?, ?)` ,
    [data.episode_id, data.user_id, data.content, data.parent_comment_id ?? null],
  )

  const commentId = Number(result.insertId)
  const comment = await queryOne<CommentWithUserRow>(
    `SELECT c.*, u.username, u.profile_picture
     FROM comments c
     LEFT JOIN users u ON u.user_id = c.user_id
     WHERE c.comment_id = ?`,
    [commentId],
  )
  if (!comment) {
    throw new Error("Failed to load comment after insert")
  }
  return comment
}

export async function deleteComment(commentId: number): Promise<void> {
  await execute("DELETE FROM comments WHERE comment_id = ?", [commentId])
}

export async function updateCommentContent(commentId: number, content: string): Promise<CommentRow | null> {
  await execute("UPDATE comments SET content = ? WHERE comment_id = ?", [content, commentId])
  return queryOne<CommentRow>("SELECT * FROM comments WHERE comment_id = ?", [commentId])
}