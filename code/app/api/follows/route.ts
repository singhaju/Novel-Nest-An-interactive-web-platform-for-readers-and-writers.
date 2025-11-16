import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isFollowingAuthor, toggleFollow } from "@/lib/repositories/follows"

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

    const isFollowing = await isFollowingAuthor(userId, authorId)

    return NextResponse.json({ isFollowing })
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
    const parsedAuthorId = Number.parseInt(String(authorId))

    if (Number.isNaN(parsedAuthorId)) {
      return NextResponse.json({ error: "Author ID is required" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    if (userId === parsedAuthorId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const result = await toggleFollow(userId, parsedAuthorId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error toggling follow:", error)
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 })
  }
}
