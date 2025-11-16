import { type NextRequest, NextResponse } from "next/server"

import { getTrendingNovels } from "@/lib/repositories/novels"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"

const SUPPORTED_PERIODS = ["daily", "weekly", "monthly", "all"] as const

type TimePeriod = (typeof SUPPORTED_PERIODS)[number]

function normalizePeriod(raw: string | null): TimePeriod {
  if (!raw) return "weekly"
  const normalized = raw.toLowerCase()
  return (SUPPORTED_PERIODS.includes(normalized as TimePeriod) ? (normalized as TimePeriod) : "weekly")
}

export async function GET(request: NextRequest) {
  try {
    const timePeriod = normalizePeriod(request.nextUrl.searchParams.get("timePeriod"))
    const sqlPeriod = timePeriod === "all" ? "all" : timePeriod

    const rawResult = await getTrendingNovels(sqlPeriod)

    const rows = Array.isArray(rawResult)
      ? rawResult.filter((row: any) => row && typeof row === "object" && "novel_id" in row)
      : []

    const novels = rows.map((row: any) => ({
      id: String(row.novel_id),
      title: row.title,
      author_id: String(row.author_id),
      summary: row.description || undefined,
  cover_url: normalizeCoverImageUrl(row.cover_image) || undefined,
      status: typeof row.status === "string" ? row.status.toLowerCase() : undefined,
      total_views: Number(row.views ?? 0),
      total_likes: Number(row.likes ?? 0),
      rating: Number(row.rating ?? 0),
      genre: row.tags || undefined,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updated_at: row.last_update instanceof Date ? row.last_update.toISOString() : row.last_update,
      author: row.author_username
        ? {
            id: String(row.author_id),
            username: row.author_username,
            avatar_url: normalizeProfileImageUrl(row.author_profile_picture) || undefined,
          }
        : undefined,
      metrics: {
        totalReviews: Number(row.total_reviews ?? 0),
        recentReviewScore: Number(row.recent_review_score ?? 0),
      },
    }))

    return NextResponse.json({ novels, timePeriod })
  } catch (error) {
    console.error("Error fetching trending novels via procedure:", error)
    return NextResponse.json({ error: "Failed to fetch trending novels" }, { status: 500 })
  }
}
