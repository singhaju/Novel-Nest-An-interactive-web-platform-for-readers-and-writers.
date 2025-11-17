import type { RowDataPacket } from "mysql2/promise"
import { execute, query, queryOne } from "../db"
import type { QueryValue } from "../db"

export interface EpisodeRow extends RowDataPacket {
  episode_id: number
  novel_id: number
  title: string
  content: string | null
  status: string
  release_date: Date
  updated_at: Date
}

export interface EpisodeWithNovelRow extends EpisodeRow {
  novel_title?: string
  author_id?: number
}

export interface EpisodeWithNovelInfo extends RowDataPacket {
  episode_id: number
  title: string
  content: string | null
  status: string
  release_date: Date
  updated_at: Date
  novel_id: number
  novel_title: string
  author_id: number | null
  author_username: string | null
}

export async function listEpisodesByNovel(novelId: number): Promise<EpisodeRow[]> {
  return query<EpisodeRow[]>(
    `SELECT episode_id, novel_id, title, status, release_date
     FROM episodes
     WHERE novel_id = ?
     ORDER BY episode_id ASC`,
    [novelId],
  )
}

export async function createEpisode(data: {
  novel_id: number
  title: string
  content: string | null
  status?: string
}): Promise<EpisodeRow> {
  const result = await execute(
    `INSERT INTO episodes (novel_id, title, content, status)
     VALUES (?, ?, ?, ?)` ,
    [data.novel_id, data.title, data.content ?? null, (data.status ?? "PENDING_APPROVAL").toUpperCase()],
  )

  const episodeId = Number(result.insertId)
  const created = await queryOne<EpisodeRow>(
    `SELECT episode_id, novel_id, title, content, status, release_date, updated_at
     FROM episodes WHERE episode_id = ?`,
    [episodeId],
  )

  if (!created) {
    throw new Error("Failed to load episode after insert")
  }

  return created
}

export async function findEpisodeWithNovel(episodeId: number): Promise<EpisodeWithNovelRow | null> {
  return queryOne<EpisodeWithNovelRow>(
    `SELECT e.*, n.title as novel_title, n.author_id as author_id
     FROM episodes e
     LEFT JOIN novels n ON n.novel_id = e.novel_id
     WHERE e.episode_id = ?`,
    [episodeId],
  )
}

export async function findEpisodeWithDetails(episodeId: number): Promise<EpisodeWithNovelInfo | null> {
  return queryOne<EpisodeWithNovelInfo>(
    `SELECT e.episode_id, e.title, e.content, e.status, e.release_date,
            e.novel_id, n.title AS novel_title, n.author_id AS author_id,
            u.username AS author_username
     FROM episodes e
     LEFT JOIN novels n ON n.novel_id = e.novel_id
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE e.episode_id = ?`,
    [episodeId],
  )
}

export async function updateEpisode(
  episodeId: number,
  data: Partial<Pick<EpisodeRow, "title" | "content" | "status">>,
): Promise<EpisodeRow | null> {
  const fields: string[] = []
  const values: QueryValue[] = []

  if (typeof data.title !== "undefined") {
    fields.push("title = ?")
    values.push(data.title)
  }

  if (typeof data.content !== "undefined") {
    fields.push("content = ?")
    values.push(data.content)
  }

  if (typeof data.status !== "undefined") {
    fields.push("status = ?")
    values.push(data.status)
  }

  if (fields.length === 0) {
    return queryOne<EpisodeRow>("SELECT * FROM episodes WHERE episode_id = ?", [episodeId])
  }

  values.push(episodeId)
  await execute(`UPDATE episodes SET ${fields.join(", ")} WHERE episode_id = ?`, values)
  return queryOne<EpisodeRow>("SELECT * FROM episodes WHERE episode_id = ?", [episodeId])
}

export async function deleteEpisode(episodeId: number): Promise<void> {
  await execute("DELETE FROM episodes WHERE episode_id = ?", [episodeId])
}

export async function countPendingEpisodesByNovel(novelId: number): Promise<number> {
  const row = await queryOne<RowDataPacket>(
    "SELECT COUNT(*) as total FROM episodes WHERE novel_id = ? AND status = 'PENDING_APPROVAL'",
    [novelId],
  )
  return Number(row?.total ?? 0)
}

export interface PendingEpisodeRow extends RowDataPacket {
  episode_id: number
  title: string
  novel_id: number
  novel_title: string
  author_username: string | null
  status: string
  submitted_at: Date
}

export async function listPendingEpisodes(): Promise<PendingEpisodeRow[]> {
  return query<PendingEpisodeRow[]>(
    `SELECT e.episode_id, e.title, e.novel_id, e.status, e.release_date AS submitted_at,
            n.title AS novel_title, u.username AS author_username
     FROM episodes e
     LEFT JOIN novels n ON n.novel_id = e.novel_id
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE e.status = 'PENDING_APPROVAL'
     ORDER BY e.release_date DESC`,
    [],
  )
}

export async function countEpisodesByNovel(novelId: number): Promise<number> {
  const row = await queryOne<RowDataPacket>(
    "SELECT COUNT(*) as total FROM episodes WHERE novel_id = ?",
    [novelId],
  )
  return row ? Number(row.total) : 0
}

export async function listEpisodeIdsForNovel(
  novelId: number,
  options: { status?: string } = {},
): Promise<number[]> {
  const conditions = ["novel_id = ?"]
  const params: QueryValue[] = [novelId]

  if (options.status) {
    conditions.push("status = ?")
    params.push(options.status.toUpperCase())
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const rows = await query<RowDataPacket[]>(
    `SELECT episode_id FROM episodes ${whereClause} ORDER BY episode_id ASC`,
    params,
  )
  return rows.map((row) => Number(row.episode_id))
}

export async function approveAllEpisodesForNovel(novelId: number): Promise<void> {
  await execute("UPDATE episodes SET status = 'APPROVED' WHERE novel_id = ?", [novelId])
}