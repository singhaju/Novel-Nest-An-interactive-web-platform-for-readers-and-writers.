import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/likes - Toggle like (not in original backend, adding for frontend compatibility)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const novel = await prisma.novel.findUnique({
      where: { novel_id: novelIdNumber },
    })

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const existing = await prisma.novelLike.findUnique({
      where: {
        user_id_novel_id: {
          user_id: userId,
          novel_id: novelIdNumber,
        },
      },
    })

    if (existing) {
      const nextLikeCount = Math.max((novel.likes ?? 0) - 1, 0)
      const [, updatedNovel] = await prisma.$transaction([
        prisma.novelLike.delete({
          where: {
            user_id_novel_id: {
              user_id: userId,
              novel_id: novelIdNumber,
            },
          },
        }),
        prisma.novel.update({
          where: { novel_id: novelIdNumber },
          data: { likes: nextLikeCount },
        }),
      ])

      return NextResponse.json({ action: "removed", likes: updatedNovel.likes ?? nextLikeCount })
    }

    const [, updatedNovel] = await prisma.$transaction([
      prisma.novelLike.create({
        data: {
          user_id: userId,
          novel_id: novelIdNumber,
        },
      }),
      prisma.novel.update({
        where: { novel_id: novelIdNumber },
        data: { likes: (novel.likes ?? 0) + 1 },
      }),
    ])

    return NextResponse.json({ action: "added", likes: updatedNovel.likes ?? (novel.likes ?? 0) + 1 })
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
