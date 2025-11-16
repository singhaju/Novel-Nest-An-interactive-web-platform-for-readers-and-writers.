import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const wishlist = await prisma.userWishlist.findMany({
      where: { user_id: userId },
      include: {
        novel: {
          include: {
            author: {
              select: {
                user_id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        added_at: "desc",
      },
    })

    return NextResponse.json(wishlist)
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

// POST /api/wishlist - Toggle wishlist
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

    // Check if already in wishlist
    const existing = await prisma.userWishlist.findUnique({
      where: {
        user_id_novel_id: {
          user_id: userId,
          novel_id: novelId,
        },
      },
    })

    if (existing) {
      await prisma.$executeRaw`CALL RemoveFromWishlist(${userId}, ${novelId})`

      return NextResponse.json({ action: "removed" })
    } else {
      await prisma.$executeRaw`CALL AddToWishlist(${userId}, ${novelId})`

      return NextResponse.json({ action: "added" })
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error)
    return NextResponse.json({ error: "Failed to toggle wishlist" }, { status: 500 })
  }
}
