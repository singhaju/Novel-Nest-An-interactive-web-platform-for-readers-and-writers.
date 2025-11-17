import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findReviewById, getAverageRatingForNovel, updateNovelRating, updateReview } from "@/lib/repositories/reviews"

export async function PATCH(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params instanceof Promise ? await context.params : context?.params
    const reviewId = Number.parseInt(rawParams?.id)

    if (Number.isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 })
    }

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingReview = await findReviewById(reviewId)

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)

    if (existingReview.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const payload: { rating?: number; comment?: string | null } = {}
    let hasChanges = false

    if (typeof body.rating !== "undefined") {
      const ratingValue = Number(body.rating)
      if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
      }
      payload.rating = ratingValue
      hasChanges = true
    }

    if (typeof body.comment !== "undefined") {
      if (body.comment === null) {
        payload.comment = null
      } else if (typeof body.comment === "string") {
        payload.comment = body.comment
      } else {
        return NextResponse.json({ error: "Invalid comment" }, { status: 400 })
      }
      hasChanges = true
    }

    if (!hasChanges) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const updatedReview = await updateReview(reviewId, payload)

    if (!updatedReview) {
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }

    const avgRating = await getAverageRatingForNovel(existingReview.novel_id)
    await updateNovelRating(existingReview.novel_id, avgRating)

    return NextResponse.json({
      ...updatedReview,
      user: {
        user_id: updatedReview.user_id,
        username: updatedReview.user_username,
        profile_picture: updatedReview.user_profile_picture,
      },
    })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}
