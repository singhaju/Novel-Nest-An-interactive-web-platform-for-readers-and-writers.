import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findNovelById } from "@/lib/repositories/novels"
import { toggleNovelLike } from "@/lib/repositories/likes"
import { canUseReaderFeatures, getSessionRole } from "@/lib/permissions"

// POST /api/likes - Toggle like (not in original backend, adding for frontend compatibility)
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

    if (!novelId) {
      return NextResponse.json({ error: "Novel ID is required" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)
    const novelIdNumber = Number.parseInt(novelId)

    if (Number.isNaN(novelIdNumber)) {
      return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
    }

    // Check if already liked (we need to create a Likes table in schema)
    // For now, we'll just increment/decrement the likes count on the novel
    const novel = await findNovelById(novelIdNumber)

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }
    const result = await toggleNovelLike(userId, novelIdNumber)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
