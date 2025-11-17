import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  createReviewWithUser,
  findReviewByNovelAndUser,
  getAverageRatingForNovel,
  updateNovelRating,
} from "@/lib/repositories/reviews"

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const existingReview = await findReviewByNovelAndUser(novelId, userId)

    if (existingReview) {
      return NextResponse.json({ error: "You already reviewed this novel. Edit your review instead." }, { status: 409 })
    }

    const review = await createReviewWithUser({
      novel_id: novelId,
      user_id: userId,
      rating,
      comment,
    })

    const avgRating = await getAverageRatingForNovel(novelId)
    await updateNovelRating(novelId, avgRating)

    return NextResponse.json(
      {
        ...review,
        user: {
          user_id: review.user_id,
          username: review.user_username,
          profile_picture: review.user_profile_picture,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
