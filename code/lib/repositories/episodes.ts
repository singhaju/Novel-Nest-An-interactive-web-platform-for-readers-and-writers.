import type { RowDataPacket } from "mysql2/promise"
import { execute, query, queryOne } from "../db"
import type { QueryValue } from "../db"

export interface EpisodeRow extends RowDataPacket {
  episode_id: number
  novel_id: number
  title: string
  content: string | null
  release_date: Date
}

export interface EpisodeWithNovelRow extends EpisodeRow {
  novel_title?: string
  author_id?: number
}

export interface EpisodeWithNovelInfo extends RowDataPacket {
  episode_id: number
  title: string
  content: string | null
  release_date: Date
  novel_id: number
  novel_title: string
  author_username: string | null
}

export async function listEpisodesByNovel(novelId: number): Promise<EpisodeRow[]> {
  return query<EpisodeRow[]>(
    `SELECT episode_id, novel_id, title, release_date
     FROM episodes
     WHERE novel_id = ?
     ORDER BY episode_id ASC`,
    [novelId],
  )
}

export async function createEpisode(data: { novel_id: number; title: string; content: string | null }): Promise<EpisodeRow> {
  const result = await execute(
    `INSERT INTO episodes (novel_id, title, content)
     VALUES (?, ?, ?)` ,
    [data.novel_id, data.title, data.content ?? null],
  )

  const episodeId = Number(result.insertId)
  const created = await queryOne<EpisodeRow>(
    `SELECT episode_id, novel_id, title, content, release_date
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
    `SELECT e.episode_id, e.title, e.content, e.release_date,
            e.novel_id, n.title AS novel_title,
            u.username AS author_username
     FROM episodes e
     LEFT JOIN novels n ON n.novel_id = e.novel_id
     LEFT JOIN users u ON u.user_id = n.author_id
     WHERE e.episode_id = ?`,
    [episodeId],
  )
}

export async function updateEpisode(episodeId: number, data: Partial<Pick<EpisodeRow, "title" | "content">>): Promise<EpisodeRow | null> {
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

export async function countEpisodesByNovel(novelId: number): Promise<number> {
  const row = await queryOne<RowDataPacket>(
    "SELECT COUNT(*) as total FROM episodes WHERE novel_id = ?",
    [novelId],
  )
  return row ? Number(row.total) : 0
}

export async function listEpisodeIdsForNovel(novelId: number): Promise<number[]> {
  const rows = await query<RowDataPacket[]>(
    `SELECT episode_id FROM episodes WHERE novel_id = ? ORDER BY episode_id ASC`,
    [novelId],
  )
  return rows.map((row) => Number(row.episode_id))
}