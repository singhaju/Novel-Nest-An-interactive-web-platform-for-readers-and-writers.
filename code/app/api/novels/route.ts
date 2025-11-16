import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_COVER_FOLDER_ID, uploadToGoogleDrive } from "@/lib/google-drive"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"

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

    const where: any = {}
    const andConditions: any[] = []

    if (status.length > 0) {
      // Prisma enum values are uppercase (see prisma/schema.prisma). Normalize
      // incoming values to uppercase so clients may send `ongoing,completed` or
      // `ONGOING`.
      where.status = { in: status.map((s) => s.toUpperCase()) }
    }

    if (genre) {
      const normalizedGenre = genre.trim()
      if (normalizedGenre.length > 0) {
        where.tags = { contains: normalizedGenre }
      }
    }

    if (authorId) {
      where.author_id = Number.parseInt(authorId)
    }

    if (query) {
      const normalizedQuery = query.replace(/\s+/g, " ").trim()
      if (normalizedQuery.length > 0) {
        const normalizedQueryLower = normalizedQuery.toLowerCase()
        const normalizedQueryUpper = normalizedQuery.toUpperCase()
        const queryVariants = Array.from(
          new Set(
            [normalizedQuery, normalizedQueryLower, normalizedQueryUpper].filter((variant): variant is string =>
              Boolean(variant && variant.length > 0),
            ),
          ),
        )

        const queryConditions: any[] = []

        if (isSuggestScope) {
          for (const variant of queryVariants) {
            queryConditions.push({ title: { startsWith: variant } })
            queryConditions.push({ author: { is: { username: { startsWith: variant } } } })
          }
          for (const variant of queryVariants) {
            if (variant.length >= 3) {
              queryConditions.push({ title: { contains: variant } })
              queryConditions.push({ author: { is: { username: { contains: variant } } } })
            }
            if (variant.length >= 4) {
              queryConditions.push({ tags: { contains: variant } })
            }
          }
        } else {
          queryConditions.push({ title: { contains: normalizedQuery } })
          queryConditions.push({ tags: { contains: normalizedQuery } })
          queryConditions.push({ author: { is: { username: { contains: normalizedQuery } } } })
          queryConditions.push({ description: { contains: normalizedQuery } })

          if (normalizedQueryLower !== normalizedQuery) {
            queryConditions.push({ title: { contains: normalizedQueryLower } })
            queryConditions.push({ tags: { contains: normalizedQueryLower } })
            queryConditions.push({ author: { is: { username: { contains: normalizedQueryLower } } } })
            queryConditions.push({ description: { contains: normalizedQueryLower } })
          }
        }

        if (queryConditions.length > 0) {
          andConditions.push({ OR: queryConditions })
        }
      }
    }

    if (andConditions.length > 0) {
      where.AND = where.AND ? [...where.AND, ...andConditions] : andConditions
    }

    const orderBy = isSuggestScope
      ? [{ title: "asc" as const }, { views: "desc" as const }]
      : [{ views: "desc" as const }]

    const novels = await prisma.novel.findMany({
      where,
      include: {
        author: {
          select: {
            user_id: true,
            username: true,
            profile_picture: true,
          },
        },
        _count: {
          select: {
            episodes: true,
            reviews: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    })

    const total = await prisma.novel.count({ where })

    // Map Prisma model fields to the frontend shape expected by components
    const mapped = novels.map((n: any) => ({
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
      author: n.author
        ? {
            id: String(n.author.user_id),
            username: n.author.username,
            avatar_url: normalizeProfileImageUrl(n.author.profile_picture) || undefined,
          }
        : undefined,
    }))

    return NextResponse.json({ novels: mapped, total, limit, offset })
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

    const role = typeof (session.user as any).role === "string" ? (session.user as any).role.toLowerCase() : "reader"
    if (!["writer", "admin", "developer", "superadmin"].includes(role)) {
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

    const novel = await prisma.novel.create({
      data: {
        title,
        description,
        tags,
        cover_image: coverImageUrl,
        author_id: Number.parseInt((session.user as any).id),
        status: "PENDING_APPROVAL",
      },
      include: {
        author: {
          select: {
            user_id: true,
            username: true,
            profile_picture: true,
          },
        },
      },
    })

    const responsePayload = {
      ...novel,
      cover_image: normalizeCoverImageUrl(novel.cover_image) ?? undefined,
      author: novel.author
        ? {
            ...novel.author,
            profile_picture: normalizeProfileImageUrl(novel.author.profile_picture) ?? undefined,
          }
        : novel.author,
    }

    return NextResponse.json(responsePayload, { status: 201 })
  } catch (error) {
    console.error("Error creating novel:", error)
    return NextResponse.json({ error: "Failed to create novel" }, { status: 500 })
  }
}
