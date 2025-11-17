import type { RowDataPacket } from "mysql2/promise"
import { execute, queryOne } from "../db"

export interface ReviewWithUserRow extends RowDataPacket {
  review_id: number
  novel_id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: Date
  user_username: string | null
  user_profile_picture: string | null
}

export async function createReviewWithUser(data: {
  novel_id: number
  user_id: number
  rating: number
  comment?: string | null
}): Promise<ReviewWithUserRow> {
  const result = await execute(
    `INSERT INTO reviews (novel_id, user_id, rating, comment)
     VALUES (?, ?, ?, ?)` ,
    [data.novel_id, data.user_id, data.rating, data.comment ?? null],
  )

  const reviewId = Number(result.insertId)
  const review = await findReviewById(reviewId)

  if (!review) {
    throw new Error("Failed to load review after insert")
  }

  return review
}

export async function getAverageRatingForNovel(novelId: number): Promise<number> {
  const row = await queryOne<RowDataPacket>("SELECT AVG(rating) as avgRating FROM reviews WHERE novel_id = ?", [novelId])
  return Number(row?.avgRating ?? 0)
}

export async function updateNovelRating(novelId: number, rating: number): Promise<void> {
  await execute("UPDATE novels SET rating = ? WHERE novel_id = ?", [rating, novelId])
}

export async function findReviewByNovelAndUser(novelId: number, userId: number): Promise<ReviewWithUserRow | null> {
  return queryOne<ReviewWithUserRow>(
    `SELECT r.*, u.username as user_username, u.profile_picture as user_profile_picture
     FROM reviews r
     LEFT JOIN users u ON u.user_id = r.user_id
     WHERE r.novel_id = ? AND r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT 1`,
    [novelId, userId],
  )
}

export async function findReviewById(reviewId: number): Promise<ReviewWithUserRow | null> {
  return queryOne<ReviewWithUserRow>(
    `SELECT r.*, u.username as user_username, u.profile_picture as user_profile_picture
     FROM reviews r
     LEFT JOIN users u ON u.user_id = r.user_id
     WHERE r.review_id = ?
     LIMIT 1`,
    [reviewId],
  )
}

export async function updateReview(
  reviewId: number,
  data: { rating?: number; comment?: string | null },
): Promise<ReviewWithUserRow | null> {
  const fields: string[] = []
  const values: (number | string | null)[] = []

  if (typeof data.rating === "number") {
    fields.push("rating = ?")
    values.push(data.rating)
  }

  if (typeof data.comment !== "undefined") {
    fields.push("comment = ?")
    values.push(data.comment ?? null)
  }

  if (fields.length === 0) {
    return findReviewById(reviewId)
  }

  values.push(reviewId)
  await execute(`UPDATE reviews SET ${fields.join(", ")} WHERE review_id = ?`, values)
  return findReviewById(reviewId)
}