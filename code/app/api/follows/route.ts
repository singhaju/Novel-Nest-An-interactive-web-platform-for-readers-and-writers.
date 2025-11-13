import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/follows?authorId=123 - Check follow status
export async function GET(request: NextRequest) {
  try {
    const authorIdParam = request.nextUrl.searchParams.get("authorId")

    if (!authorIdParam) {
      return NextResponse.json({ error: "Author ID is required" }, { status: 400 })
    }

    const authorId = Number.parseInt(authorIdParam)
    if (Number.isNaN(authorId)) {
      return NextResponse.json({ error: "Invalid author ID" }, { status: 400 })
    }

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ isFollowing: false })
    }

    const userId = Number.parseInt((session.user as any).id)

    const existing = await prisma.userFollow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userId,
          following_id: authorId,
        },
      },
    })

    return NextResponse.json({ isFollowing: Boolean(existing) })
  } catch (error) {
    console.error("Error checking follow status:", error)
    return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 })
  }
}

// POST /api/follows - Toggle follow
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { authorId } = body

    if (!authorId) {
      return NextResponse.json({ error: "Author ID is required" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    if (userId === authorId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const existing = await prisma.userFollow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userId,
          following_id: authorId,
        },
      },
    })

    if (existing) {
      // Unfollow
      await prisma.userFollow.delete({
        where: {
          follower_id_following_id: {
            follower_id: userId,
            following_id: authorId,
          },
        },
      })

      return NextResponse.json({ action: "unfollowed" })
    } else {
      // Follow
      await prisma.userFollow.create({
        data: {
          follower_id: userId,
          following_id: authorId,
        },
      })

      return NextResponse.json({ action: "followed" })
    }
  } catch (error) {
    console.error("Error toggling follow:", error)
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 })
  }
}
