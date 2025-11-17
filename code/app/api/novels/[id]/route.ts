import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  deleteNovel as deleteNovelRecord,
  findNovelById,
  getNovelDetail,
  updateNovel as updateNovelRecord,
} from "@/lib/repositories/novels"
import { approveAllEpisodesForNovel } from "@/lib/repositories/episodes"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"
import { getSessionRole, hasMinimumRole } from "@/lib/permissions"

// GET /api/novels/[id] - Get a single novel
// handle both Promise and direct params shape to satisfy Next.js type variations
export async function GET(request: NextRequest, context: any) {
  try {
    // `context.params` may be a Promise in some dev type-checking scenarios
    const rawParams = context?.params instanceof Promise ? await context.params : context?.params;
    const novelId = Number.parseInt(rawParams?.id);

    // Validate novelId
    if (isNaN(novelId)) {
      return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
    }

    const detail = await getNovelDetail(novelId)

    if (!detail) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const normalizedNovel = {
      ...detail.novel,
      cover_image: normalizeCoverImageUrl(detail.novel.cover_image) ?? null,
      author: detail.novel.author_user_id
        ? {
            user_id: detail.novel.author_user_id,
            username: detail.novel.author_username,
            profile_picture: normalizeProfileImageUrl(detail.novel.author_profile_picture ?? undefined) ?? null,
            bio: detail.novel.author_bio ?? null,
          }
        : null,
      episodes: detail.episodes,
      reviews: detail.reviews.map((review) => ({
        review_id: review.review_id,
        novel_id: review.novel_id,
        user_id: review.user_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user: {
          user_id: review.review_user_id,
          username: review.review_username,
          profile_picture: normalizeProfileImageUrl(review.review_profile_picture ?? undefined) ?? null,
        },
      })),
      _count: detail.counts,
    }

    return NextResponse.json(normalizedNovel)
  } catch (error) {
    console.error("Error fetching novel:", error)
    return NextResponse.json({ error: "Failed to fetch novel" }, { status: 500 })
  }
}

// PATCH /api/novels/[id] - Update a novel
export async function PATCH(request: NextRequest, context: any) {
  const rawParams = context?.params instanceof Promise ? await context.params : context?.params;
  const novelId = Number.parseInt(rawParams?.id);
  
  // Validate novelId
  if (isNaN(novelId)) {
    return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
  }
  
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Check if user is the author or admin
    const novel = await findNovelById(novelId)

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)
    const role = getSessionRole(session)
    const isOwner = novel.author_id === userId
    const canModerate = hasMinimumRole(role, "admin")

    if (!isOwner && !canModerate) {
    const userRole = typeof userRoleRaw === "string" ? userRoleRaw.toLowerCase() : "reader"
    const privilegedRoles = ["admin", "developer", "superadmin"]
    const isPrivileged = privilegedRoles.includes(userRole)

    if (novel.author_id !== userId && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const payload: Record<string, any> = {}
    if (typeof body.title === "string") payload.title = body.title
    if (typeof body.description === "string") payload.description = body.description
    if (typeof body.cover_image === "string") payload.cover_image = body.cover_image
    if (typeof body.tags === "string") payload.tags = body.tags

    const requestedStatus = typeof body.status === "string" ? body.status.toUpperCase() : undefined
    if (requestedStatus) {
      if (!isPrivileged) {
        return NextResponse.json({ error: "Status updates require admin access" }, { status: 403 })
      }
      payload.status = requestedStatus
    }

    const updatedNovel = await updateNovelRecord(novelId, payload)

    if (
      isPrivileged &&
      requestedStatus &&
      ["ONGOING", "COMPLETED", "HIATUS"].includes(requestedStatus)
    ) {
      await approveAllEpisodesForNovel(novelId)
    }

    return NextResponse.json(updatedNovel)
  } catch (error) {
    console.error("Error updating novel:", error)
    return NextResponse.json({ error: "Failed to update novel" }, { status: 500 })
  }
}

// DELETE /api/novels/[id] - Delete a novel
export async function DELETE(request: NextRequest, context: any) {
  const rawParams = context?.params instanceof Promise ? await context.params : context?.params;
  const novelId = Number.parseInt(rawParams?.id);
  
  // Validate novelId
  if (isNaN(novelId)) {
    return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
  }
  
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is the author or admin
    const novel = await findNovelById(novelId)

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)
    const role = getSessionRole(session)
    const isOwner = novel.author_id === userId
    const canModerate = hasMinimumRole(role, "admin")

    if (!isOwner && !canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await deleteNovelRecord(novelId)

    return NextResponse.json({ message: "Novel deleted successfully" })
  } catch (error) {
    console.error("Error deleting novel:", error)
    return NextResponse.json({ error: "Failed to delete novel" }, { status: 500 })
  }
}
