import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  deleteNovel as deleteNovelRecord,
  findNovelById,
  getNovelDetail,
  updateNovel as updateNovelRecord,
} from "@/lib/repositories/novels"
import { approveAllEpisodesForNovel, denyAllEpisodesForNovel } from "@/lib/repositories/episodes"
import { DEFAULT_COVER_FOLDER_ID, uploadToGoogleDrive } from "@/lib/google-drive"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"

// GET /api/novels/[id] - Get a single novel
// handle both Promise and direct params shape to satisfy Next.js type variations
export async function GET(request: NextRequest, context: any) {
  try {
    const session = await auth()
    const userRole = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
    const userId = session?.user ? Number.parseInt((session.user as any).id) : null
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

    const novelStatus = (detail.novel.status ?? "").toUpperCase()
    const privilegedRoles = new Set(["admin", "superadmin", "developer"])
    const isAuthor = userId !== null && detail.novel.author_id === userId
    const isPublicStatus = ["ONGOING", "COMPLETED", "HIATUS"].includes(novelStatus)

    if (!isPublicStatus && !isAuthor && !privilegedRoles.has(userRole)) {
      return NextResponse.json({ error: "Novel not available" }, { status: 404 })
    }

    const approvedEpisodes = detail.episodes.filter(
      (episode) => (episode.status ?? "").toUpperCase() === "APPROVED",
    )

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
      episodes: approvedEpisodes,
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

    const novel = await findNovelById(novelId)

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userRoleRaw = (session.user as any).role
    const userId = Number.parseInt((session.user as any).id)

    const userRole = typeof userRoleRaw === "string" ? userRoleRaw.toLowerCase() : "reader"
    const authoringRoles = ["author", "writer", "admin", "superadmin"]
    if (!authoringRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const privilegedRoles = ["admin", "superadmin"]
    const isPrivileged = privilegedRoles.includes(userRole)

    if (novel.author_id !== userId && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const contentType = request.headers.get("content-type") || ""
    const payload: Record<string, any> = {}
    let requestedStatus: string | undefined

    const normaliseTags = (value: unknown) => {
      if (typeof value !== "string") return
      let normalized = value
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          normalized = parsed
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0)
            .join(", ")
        }
      } catch (error) {
        // treat as comma-separated string
      }
      payload.tags = normalized
    }

    const enforceStatusPermission = () => {
      if (!requestedStatus) {
        return
      }
      if (!isPrivileged) {
        throw new Error("STATUS_FORBIDDEN")
      }
      payload.status = requestedStatus
    }

    if (contentType.includes("application/json")) {
      const body = await request.json()
      if (typeof body.title === "string") payload.title = body.title
      if (typeof body.description === "string") payload.description = body.description
      if (typeof body.cover_image === "string" || body.cover_image === null) payload.cover_image = body.cover_image
      if (typeof body.tags === "string") normaliseTags(body.tags)
      if (typeof body.status === "string") {
        requestedStatus = body.status.toUpperCase()
      }
      enforceStatusPermission()
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const title = formData.get("title")
      const description = formData.get("description")
      const tags = formData.get("tags")
      const status = formData.get("status")
      const removeCover = formData.get("removeCover")
      const coverImage = formData.get("coverImage")

      if (typeof title === "string" && title.trim().length > 0) {
        payload.title = title.trim()
      }
      if (typeof description === "string") {
        payload.description = description
      }
      if (typeof status === "string" && status.trim().length > 0) {
        requestedStatus = status.trim().toUpperCase()
      }
      if (typeof tags === "string" && tags.length > 0) {
        normaliseTags(tags)
      }

      if (removeCover === "true") {
        payload.cover_image = null
      } else if (coverImage instanceof File && coverImage.size > 0) {
        const buffer = Buffer.from(await coverImage.arrayBuffer())
        const rawUrl = await uploadToGoogleDrive({
          fileName: `cover_${novelId}_${Date.now()}_${coverImage.name || "upload"}`,
          mimeType: coverImage.type || "application/octet-stream",
          fileContent: buffer,
          folderId: DEFAULT_COVER_FOLDER_ID,
        })
        payload.cover_image = normalizeCoverImageUrl(rawUrl) || rawUrl
      }
      enforceStatusPermission()
    } else {
      // Fallback: attempt to parse json
      const body = await request.json().catch(() => ({}))
      if (typeof body.title === "string") payload.title = body.title
      if (typeof body.description === "string") payload.description = body.description
      if (typeof body.cover_image === "string" || body.cover_image === null) payload.cover_image = body.cover_image
      if (typeof body.tags === "string") normaliseTags(body.tags)
      if (typeof body.status === "string") {
        requestedStatus = body.status.toUpperCase()
      }
      enforceStatusPermission()
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const updatedNovel = await updateNovelRecord(novelId, payload)

    if (isPrivileged && requestedStatus) {
      if (["ONGOING", "COMPLETED", "HIATUS"].includes(requestedStatus)) {
        await approveAllEpisodesForNovel(novelId)
      } else if (requestedStatus === "DENIAL") {
        await denyAllEpisodesForNovel(novelId)
      }
    }

  return NextResponse.json(updatedNovel)
  } catch (error) {
    if (error instanceof Error && error.message === "STATUS_FORBIDDEN") {
      return NextResponse.json({ error: "Status updates require admin access" }, { status: 403 })
    }
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

    const userRoleRaw = (session.user as any).role
    const userId = Number.parseInt((session.user as any).id)

    const userRole = typeof userRoleRaw === "string" ? userRoleRaw.toLowerCase() : "reader"
    const authoringRoles = ["author", "writer", "admin", "superadmin"]
    if (!authoringRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (novel.author_id !== userId && !["admin", "superadmin"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await deleteNovelRecord(novelId)

    return NextResponse.json({ message: "Novel deleted successfully" })
  } catch (error) {
    console.error("Error deleting novel:", error)
    return NextResponse.json({ error: "Failed to delete novel" }, { status: 500 })
  }
}
