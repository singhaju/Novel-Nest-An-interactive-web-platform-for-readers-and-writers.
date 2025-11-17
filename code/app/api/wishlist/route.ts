import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listWishlistByUser, toggleWishlistEntry } from "@/lib/repositories/wishlist"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"
import { canUseReaderFeatures, getSessionRole } from "@/lib/permissions"

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = getSessionRole(session)
    if (!canUseReaderFeatures(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const wishlist = await listWishlistByUser(userId)

    const mapped = wishlist.map((item) => ({
      user_id: item.user_id,
      novel_id: item.novel_id,
      added_at: item.added_at,
      novel: {
        novel_id: item.novel_id,
        title: item.title,
        description: item.description,
        cover_image: normalizeCoverImageUrl(item.cover_image) ?? item.cover_image,
        tags: item.tags,
        status: item.status,
        author: item.author_user_id
          ? {
              user_id: item.author_user_id,
              username: item.author_username,
              profile_picture: normalizeProfileImageUrl(item.author_profile_picture ?? undefined) ?? undefined,
            }
          : null,
      },
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

// POST /api/wishlist - Toggle wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = getSessionRole(session)
    if (!canUseReaderFeatures(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { novelId } = body
    const parsedNovelId = Number.parseInt(String(novelId))

    if (Number.isNaN(parsedNovelId)) {
      return NextResponse.json({ error: "Novel ID is required" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const result = await toggleWishlistEntry(userId, parsedNovelId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error toggling wishlist:", error)
    return NextResponse.json({ error: "Failed to toggle wishlist" }, { status: 500 })
  }
}
