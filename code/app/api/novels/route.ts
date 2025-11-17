import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createNovel as createNovelRecord, searchNovels } from "@/lib/repositories/novels"
import { DEFAULT_COVER_FOLDER_ID, uploadToGoogleDrive } from "@/lib/google-drive"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"
import { getSessionRole, hasMinimumRole } from "@/lib/permissions"

// GET /api/novels - Get all novels with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    // allow multiple ?status= or a comma-separated single status param
    const rawStatus = searchParams.getAll("status") // allow multiple ?status=
    let status: string[] = []
    if (rawStatus.length === 1 && rawStatus[0].includes(",")) {
      status = rawStatus[0].split(",").map((s) => s.trim())
    } else {
      status = rawStatus.map((s) => s.trim()).filter(Boolean)
    }
    const genre = searchParams.get("genre")
    const authorId = searchParams.get("authorId")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const scope = searchParams.get("scope")
    const query = searchParams.get("q")?.trim()
    const isSuggestScope = scope === "suggest"

    if (isSuggestScope && !query) {
      return NextResponse.json({ novels: [], total: 0, limit, offset })
    }

    const result = await searchNovels({
      status,
      genre,
      authorId: authorId ? Number(authorId) : undefined,
      limit,
      offset,
      scope,
      query,
    })

    const mapped = result.rows.map((n) => ({
      id: String(n.novel_id),
      title: n.title,
      author_id: String(n.author_id),
      summary: n.description || undefined,
      cover_url: normalizeCoverImageUrl(n.cover_image) || undefined,
      status: (n.status || "").toLowerCase(),
      total_views: n.views ?? 0,
      total_likes: n.likes ?? 0,
      rating: Number(n.rating ?? 0),
      genre: n.tags || undefined,
      created_at: n.created_at?.toISOString?.() ?? n.created_at,
      updated_at: n.last_update?.toISOString?.() ?? n.last_update,
      author: n.author_user_id
        ? {
            id: String(n.author_user_id),
            username: n.author_username ?? "Unknown",
            avatar_url: normalizeProfileImageUrl(n.author_profile_picture ?? undefined) || undefined,
          }
        : undefined,
      _count: {
        episodes: n.episode_count,
        reviews: n.review_count,
      },
    }))

    return NextResponse.json({ novels: mapped, total: result.total, limit, offset })
  } catch (error) {
    console.error("Error fetching novels:", error)
    return NextResponse.json({ error: "Failed to fetch novels" }, { status: 500 })
  }
}


// POST /api/novels - Create a new novel
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = getSessionRole(session)
    if (!hasMinimumRole(role, "writer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const tagsRaw = formData.get("tags")
    let tags = ""

    if (typeof tagsRaw === "string") {
      try {
        const parsed = JSON.parse(tagsRaw)
        tags = Array.isArray(parsed) ? parsed.filter(Boolean).join(", ") : tagsRaw
      } catch (error) {
        tags = tagsRaw
      }
    }
    const coverImage = formData.get("coverImage") as File | null

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    let coverImageUrl: string | undefined

    // Upload cover image to Google Drive if provided
    if (coverImage) {
      const buffer = Buffer.from(await coverImage.arrayBuffer())
      const rawUrl = await uploadToGoogleDrive({
        fileName: `cover_${Date.now()}_${coverImage.name}`,
        mimeType: coverImage.type,
        fileContent: buffer,
  folderId: DEFAULT_COVER_FOLDER_ID,
      })
      coverImageUrl = normalizeCoverImageUrl(rawUrl) || rawUrl
    }

    const novel = await createNovelRecord({
      title,
      description,
      tags,
      cover_image: coverImageUrl,
      author_id: Number.parseInt((session.user as any).id),
      status: "PENDING_APPROVAL",
    })

    const responsePayload = {
      ...novel,
      cover_image: normalizeCoverImageUrl(novel.cover_image) ?? undefined,
      author: novel.author_user_id
        ? {
            user_id: novel.author_user_id,
            username: novel.author_username,
            profile_picture: normalizeProfileImageUrl(novel.author_profile_picture ?? undefined) ?? undefined,
          }
        : undefined,
    }

    return NextResponse.json(responsePayload, { status: 201 })
  } catch (error) {
    console.error("Error creating novel:", error)
    return NextResponse.json({ error: "Failed to create novel" }, { status: 500 })
  }
}
