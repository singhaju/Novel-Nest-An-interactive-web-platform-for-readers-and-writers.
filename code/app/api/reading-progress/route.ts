import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateReadingProgress } from "@/lib/repositories/reading-progress"

// POST /api/reading-progress - Update reading progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const novelId = Number.parseInt(String(body.novelId))
    const episodeId = Number.parseInt(String(body.episodeId))

    if (Number.isNaN(novelId) || Number.isNaN(episodeId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const progress = await updateReadingProgress(userId, novelId, episodeId)

    if (!progress) {
      return NextResponse.json({ error: "Failed to persist reading progress" }, { status: 500 })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error updating reading progress:", error)
    return NextResponse.json({ error: "Failed to update reading progress" }, { status: 500 })
  }
}
