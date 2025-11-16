import type { RowDataPacket } from "mysql2/promise"
import { queryOne } from "../db"

export interface CountRow extends RowDataPacket {
  total: number
}

export interface NovelCountsRow extends RowDataPacket {
  total: number
  pending: number
}

export async function getNovelCounts(): Promise<{ total: number; pending: number }> {
  const row = await queryOne<NovelCountsRow>(
    `SELECT
        (SELECT COUNT(*) FROM novels) AS total,
        (SELECT COUNT(*) FROM novels WHERE status = 'PENDING_APPROVAL') AS pending`,
  )
  return {
    total: Number(row?.total ?? 0),
    pending: Number(row?.pending ?? 0),
  }
}

export async function getUserCount(): Promise<number> {
  const row = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM users")
  return Number(row?.total ?? 0)
}

export async function getEpisodeCount(): Promise<number> {
  const row = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM episodes")
  return Number(row?.total ?? 0)
}

export async function getCommentCount(): Promise<number> {
  const row = await queryOne<CountRow>("SELECT COUNT(*) AS total FROM comments")
  return Number(row?.total ?? 0)
}
