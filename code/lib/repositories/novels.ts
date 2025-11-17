import type { RowDataPacket } from "mysql2/promise"
import { execute, getPool, query, queryOne } from "../db"
import type { QueryValue } from "../db"

export interface NovelRow extends RowDataPacket {
  novel_id: number
  title: string
  description: string | null
  cover_image: string | null
  tags: string | null
  status: string
  last_update: Date
  views: number
  likes: number
  rating: number
  created_at: Date
  author_id: number
}

export interface NovelWithAuthorRow extends NovelRow {
  author_user_id: number | null
  author_username: string | null
  author_profile_picture: string | null
  author_bio?: string | null
  episode_count: number
  review_count: number
}

export interface EpisodeSummaryRow extends RowDataPacket {
  episode_id: number
  title: string
  status: string
  release_date: Date
}

export interface EpisodeDetailRow extends EpisodeSummaryRow {
  content: string | null
}

export interface NovelCoverRow extends RowDataPacket {
  novel_id: number
  title: string
  cover_image: string | null
}

export interface RecentNovelRow extends RowDataPacket {
  novel_id: number
  title: string
  status: string
  created_at: Date
}

export interface ReviewWithUserRow extends RowDataPacket {
  review_id: number
  novel_id: number
  user_id: number
  rating: number
  comment: string | null
  created_at: Date
  review_user_id: number | null
  review_username: string | null
  review_profile_picture: string | null
}

export interface NovelDetailResult {
  novel: NovelWithAuthorRow
  episodes: EpisodeSummaryRow[]
  reviews: ReviewWithUserRow[]
  counts: {
    episodes: number
    reviews: number
    wishlists: number
  }
}

export interface AuthorNovelSummaryRow extends RowDataPacket {
  novel_id: number
  title: string
  description: string | null
  cover_image: string | null
  status: string
  views: number | null
  likes: number | null
  rating: number | null
  last_update: Date
  author_id: number
  author_username: string | null
  episode_count: number
}

export interface PendingNovelRow extends AuthorNovelSummaryRow {
  created_at: Date
  tags: string | null
}

export interface SearchNovelsParams {
  status?: string[]
  genre?: string | null
  authorId?: number
  limit?: number
  offset?: number
  scope?: "suggest" | string | null
  query?: string | null
}

export interface SearchNovelsResult {
  rows: NovelWithAuthorRow[]
  total: number
}

function buildWhereClauses(params: SearchNovelsParams): { clause: string; values: QueryValue[] } {
  const whereParts: string[] = []
  const values: QueryValue[] = []

  if (params.status && params.status.length > 0) {
    const placeholders = params.status.map(() => "?").join(",")
    whereParts.push(`n.status IN (${placeholders})`)
    values.push(...params.status.map((s) => s.toUpperCase()))
  }

  if (params.genre) {
    whereParts.push("LOWER(n.tags) LIKE ?")
    values.push(`%${params.genre.toLowerCase()}%`)
  }

  if (params.authorId) {
    whereParts.push("n.author_id = ?")
    values.push(params.authorId)
  }

  if (params.query) {
    const q = params.query.trim().toLowerCase()
    if (q.length > 0) {
      const orParts: string[] = []
      const addLike = (expression: string, value: string) => {
        orParts.push(expression)
        values.push(value)
      }

      const prefixValue = `${q}%`
      const containsValue = q.length >= 2 ? `%${q}%` : prefixValue

      if (params.scope === "suggest") {
        addLike("LOWER(n.title) LIKE ?", prefixValue)
        addLike("LOWER(u.username) LIKE ?", prefixValue)
        if (q.length >= 3) {
          addLike("LOWER(n.title) LIKE ?", containsValue)
          addLike("LOWER(u.username) LIKE ?", containsValue)
        }
      } else {
        addLike("LOWER(n.title) LIKE ?", containsValue)
        addLike("LOWER(u.username) LIKE ?", containsValue)
      }

      if (orParts.length > 0) {
        whereParts.push(`(${orParts.join(" OR ")})`)
      }
    }
  }

  const clause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : ""
  return { clause, values }
}

export async function searchNovels(params: SearchNovelsParams): Promise<SearchNovelsResult> {
  const limit = Math.max(1, Math.min(params.limit ?? 12, 100))
  const offset = Math.max(0, params.offset ?? 0)

  const { clause, values } = buildWhereClauses(params)
  const orderBy = params.scope === "suggest" ? "ORDER BY n.title ASC, n.views DESC" : "ORDER BY n.views DESC"

  const rows = await query<NovelWithAuthorRow[]>(
  `SELECT n.*, u.user_id as author_user_id, u.username as author_username, u.profile_picture as author_profile_picture, u.bio as author_bio,
            (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count,
            (SELECT COUNT(*) FROM reviews r WHERE r.novel_id = n.novel_id) AS review_count
     FROM novels n
     LEFT JOIN users u ON u.user_id = n.author_id
     ${clause}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )

  const countRow = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) as total FROM novels n
     LEFT JOIN users u ON u.user_id = n.author_id
     ${clause}`,
    values,
  )

  return {
    rows,
    total: countRow ? Number(countRow.total) : 0,
  }
}

export interface CreateNovelInput {
  title: string
  description?: string | null
  tags?: string | null
  cover_image?: string | null
  author_id: number
  status?: string
}

export async function createNovel(input: CreateNovelInput): Promise<NovelWithAuthorRow> {
  const status = (input.status ?? "PENDING_APPROVAL").toUpperCase()

  const result = await execute(
    `INSERT INTO novels (title, description, tags, cover_image, author_id, status)
     VALUES (?, ?, ?, ?, ?, ?)` ,
    [input.title, input.description ?? null, input.tags ?? null, input.cover_image ?? null, input.author_id, status],
  )

  const novelId = Number(result.insertId)
  const created = await queryOne<NovelWithAuthorRow>(
  `SELECT n.*, u.user_id as author_user_id, u.username as author_username, u.profile_picture as author_profile_picture, u.bio as author_bio,
            0 as episode_count, 0 as review_count
     FROM novels n
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE n.novel_id = ?`,
    [novelId],
  )

  if (!created) {
    throw new Error("Failed to load novel after creation")
  }

  return created
}

export async function getNovelDetail(novelId: number): Promise<NovelDetailResult | null> {
  const novel = await queryOne<NovelWithAuthorRow>(
  `SELECT n.*, u.user_id as author_user_id, u.username as author_username, u.profile_picture as author_profile_picture, u.bio as author_bio,
            (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count,
            (SELECT COUNT(*) FROM reviews r WHERE r.novel_id = n.novel_id) AS review_count
     FROM novels n
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE n.novel_id = ?`,
    [novelId],
  )

  if (!novel) {
    return null
  }

  const episodes = await query<EpisodeSummaryRow[]>(
    `SELECT episode_id, title, status, release_date FROM episodes WHERE novel_id = ? ORDER BY episode_id ASC`,
    [novelId],
  )

  const reviews = await query<ReviewWithUserRow[]>(
    `SELECT r.*, u.user_id as review_user_id, u.username as review_username, u.profile_picture as review_profile_picture
     FROM reviews r
     LEFT JOIN users u ON u.user_id = r.user_id
     WHERE r.novel_id = ?
     ORDER BY r.created_at DESC`,
    [novelId],
  )

  const countRow = await queryOne<RowDataPacket>(
    `SELECT
        (SELECT COUNT(*) FROM episodes WHERE novel_id = ?) as episodes,
        (SELECT COUNT(*) FROM reviews WHERE novel_id = ?) as reviews,
        (SELECT COUNT(*) FROM user_wishlist WHERE novel_id = ?) as wishlists`,
    [novelId, novelId, novelId],
  )

  return {
    novel,
    episodes,
    reviews,
    counts: {
      episodes: Number(countRow?.episodes ?? 0),
      reviews: Number(countRow?.reviews ?? 0),
      wishlists: Number(countRow?.wishlists ?? 0),
    },
  }
}

export async function incrementNovelViews(novelId: number): Promise<void> {
  await execute("UPDATE novels SET views = views + 1 WHERE novel_id = ?", [novelId])
}

export type NovelUpdateInput = Partial<Pick<NovelRow, "title" | "description" | "cover_image" | "tags" | "status">>

export async function updateNovel(novelId: number, data: NovelUpdateInput): Promise<NovelRow | null> {
  const fields: string[] = []
  const values: QueryValue[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      fields.push(`${key} = ?`)
      values.push(value as QueryValue)
    }
  })

  if (fields.length === 0) {
    return queryOne<NovelRow>("SELECT * FROM novels WHERE novel_id = ?", [novelId])
  }

  values.push(novelId)
  await execute(`UPDATE novels SET ${fields.join(", ")} WHERE novel_id = ?`, values)
  return queryOne<NovelRow>("SELECT * FROM novels WHERE novel_id = ?", [novelId])
}

export async function deleteNovel(novelId: number): Promise<void> {
  await execute("DELETE FROM novels WHERE novel_id = ?", [novelId])
}

export async function findNovelById(novelId: number): Promise<NovelRow | null> {
  return queryOne<NovelRow>("SELECT * FROM novels WHERE novel_id = ?", [novelId])
}

export async function listNovelsForCoverSync(): Promise<NovelCoverRow[]> {
  return query<NovelCoverRow[]>(
    "SELECT novel_id, title, cover_image FROM novels ORDER BY novel_id ASC",
    [],
  )
}

export async function listRecentNovels(limit = 5): Promise<RecentNovelRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 20))
  return query<RecentNovelRow[]>(
    `SELECT novel_id, title, status, created_at
     FROM novels
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit],
  )
}

export async function listRecentNovelsByAuthors(authorIds: number[], limit = 4): Promise<NovelWithAuthorRow[]> {
  if (!authorIds.length) {
    return []
  }

  const placeholders = authorIds.map(() => "?").join(",")
  const sql = `SELECT n.*, u.user_id as author_user_id, u.username as author_username,
                      u.profile_picture as author_profile_picture, u.bio as author_bio,
                      (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count,
                      (SELECT COUNT(*) FROM reviews r WHERE r.novel_id = n.novel_id) AS review_count
               FROM novels n
               LEFT JOIN users u ON u.user_id = n.author_id
               WHERE n.author_id IN (${placeholders}) AND n.status = 'ONGOING'
               ORDER BY n.created_at DESC
               LIMIT ?`

  return query<NovelWithAuthorRow[]>(sql, [...authorIds, limit])
}

export async function listNovelsForManagement(options: { authorId?: number; status?: string } = {}): Promise<AuthorNovelSummaryRow[]> {
  const clauses: string[] = []
  const params: QueryValue[] = []

  if (typeof options.authorId === "number") {
    clauses.push("n.author_id = ?")
    params.push(options.authorId)
  }

  if (options.status) {
    clauses.push("n.status = ?")
    params.push(options.status.toUpperCase())
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""

  const sql = `SELECT n.novel_id, n.title, n.description, n.cover_image, n.status,
                      n.views, n.likes, n.rating, n.last_update, n.author_id,
                      u.username AS author_username,
                      (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count
               FROM novels n
               LEFT JOIN users u ON u.user_id = n.author_id
               ${whereClause}
               ORDER BY n.last_update DESC`

  return query<AuthorNovelSummaryRow[]>(sql, params)
}

export async function listPendingNovels(): Promise<PendingNovelRow[]> {
  const sql = `SELECT n.novel_id, n.title, n.description, n.cover_image, n.status, n.tags,
                      n.views, n.likes, n.rating, n.created_at, n.last_update, n.author_id,
                      u.username AS author_username,
                      (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count
               FROM novels n
               LEFT JOIN users u ON u.user_id = n.author_id
               WHERE n.status = 'PENDING_APPROVAL'
               ORDER BY n.created_at DESC`
  return query<PendingNovelRow[]>(sql)
}

export interface NovelSubmissionDetail {
  novel: NovelWithAuthorRow
  episodes: EpisodeDetailRow[]
}

export async function getNovelSubmissionDetail(novelId: number): Promise<NovelSubmissionDetail | null> {
  const novel = await queryOne<NovelWithAuthorRow>(
    `SELECT n.*, u.user_id as author_user_id, u.username as author_username,
            u.profile_picture as author_profile_picture, u.bio as author_bio,
            (SELECT COUNT(*) FROM episodes e WHERE e.novel_id = n.novel_id) AS episode_count,
            (SELECT COUNT(*) FROM reviews r WHERE r.novel_id = n.novel_id) AS review_count
     FROM novels n
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE n.novel_id = ?`,
    [novelId],
  )

  if (!novel) {
    return null
  }

  const episodes = await query<EpisodeDetailRow[]>(
    `SELECT episode_id, title, status, release_date, content
     FROM episodes
     WHERE novel_id = ?
     ORDER BY episode_id ASC`,
    [novelId],
  )

  return { novel, episodes }
}

export async function getTrendingNovels(period: string): Promise<RowDataPacket[]> {
  const pool = getPool()

  try {
    const [resultSets] = await pool.query<RowDataPacket[][] | RowDataPacket[]>("CALL GetTrendingNovels(?)", [period])
    if (Array.isArray(resultSets)) {
      const flattened = (resultSets as unknown[]).filter(Array.isArray) as RowDataPacket[][]
      return flattened.flat()
    }
    return []
  } catch (error: any) {
    if (isMissingProcedureError(error)) {
      // Stored procedure not installed yet; fall back to a direct query so the UI keeps working.
      return fallbackTrendingNovels(period)
    }
    throw error
  }
}

function isMissingProcedureError(error: any): boolean {
  if (!error) return false
  if (typeof error.errno === "number" && error.errno === 1305) return true
  if (typeof error.code === "string" && ["ER_SP_DOES_NOT_EXIST", "ER_PROCEDURE_NOT_EXIST"].includes(error.code)) {
    return true
  }
  const message = typeof error.message === "string" ? error.message.toLowerCase() : ""
  return message.includes("procedure") && message.includes("does not exist")
}

async function fallbackTrendingNovels(period: string): Promise<RowDataPacket[]> {
  const safePeriod = ["daily", "weekly", "monthly", "all"].includes(period) ? period : "weekly"

  const recentCase = (() => {
    switch (safePeriod) {
      case "daily":
        return "CASE WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END"
      case "weekly":
        return "CASE WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 1 ELSE 0 END"
      case "monthly":
        return "CASE WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END"
      default:
        return "CASE WHEN r.review_id IS NOT NULL THEN 1 ELSE 0 END"
    }
  })()

  const sql = `
    SELECT
      n.novel_id,
      n.title,
      n.description,
      n.cover_image,
      n.tags,
      n.status,
      n.views,
      n.likes,
      n.rating,
      n.created_at,
      n.last_update,
      n.author_id,
      u.username AS author_username,
      u.profile_picture AS author_profile_picture,
      COUNT(r.review_id) AS total_reviews,
      SUM(${recentCase}) AS recent_review_score
    FROM novels n
    LEFT JOIN users u ON u.user_id = n.author_id
    LEFT JOIN reviews r ON r.novel_id = n.novel_id
    GROUP BY n.novel_id
    ORDER BY (n.views + n.likes + COALESCE(recent_review_score, 0)) DESC, n.last_update DESC
    LIMIT 50
  `

  return query<RowDataPacket[]>(sql, [])
}