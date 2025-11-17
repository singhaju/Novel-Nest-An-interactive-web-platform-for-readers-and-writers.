import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createReviewWithUser,
  findReviewByUserAndNovel,
  getAverageRatingForNovel,
  updateNovelRating,
  updateReviewWithUser,
} from "@/lib/repositories/reviews"
import { canUseReaderFeatures, getSessionRole } from "@/lib/permissions"

// POST /api/reviews - Create a review
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
    const { novelId, rating, comment } = body

    if (!novelId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const existing = await findReviewByUserAndNovel(novelId, userId)
    const review = existing
      ? await updateReviewWithUser(existing.review_id, { rating, comment })
      : await createReviewWithUser({
          novel_id: novelId,
          user_id: userId,
          rating,
          comment,
        })

    const avgRating = await getAverageRatingForNovel(novelId)
    await updateNovelRating(novelId, avgRating)

    const responsePayload = {
      ...review,
      user: {
        user_id: review.user_id,
        username: review.user_username,
        profile_picture: review.user_profile_picture,
      },
    }

    return NextResponse.json(responsePayload, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
