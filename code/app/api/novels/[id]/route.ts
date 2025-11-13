import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/novels/[id] - Get a single novel
// handle both Promise and direct params shape to satisfy Next.js type variations
export async function GET(request: NextRequest, context: any) {
  try {
    // `context.params` may be a Promise in some dev type-checking scenarios
    const rawParams = context?.params instanceof Promise ? await context.params : context?.params;
    const novelId = Number.parseInt(rawParams?.id);

    // Validate novelId
    if (isNaN(novelId)) {
      return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
    }

    const novel = await prisma.novel.findUnique({
      where: { novel_id: novelId },
      include: {
        author: {
          select: {
            user_id: true,
            username: true,
            profile_picture: true,
            bio: true,
          },
        },
        episodes: {
          orderBy: {
            episode_id: "asc",
          },
          select: {
            episode_id: true,
            title: true,
            release_date: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                user_id: true,
                username: true,
                profile_picture: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
        _count: {
          select: {
            episodes: true,
            reviews: true,
            wishlists: true,
          },
        },
      },
    })

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    // Increment view count
    await prisma.novel.update({
      where: { novel_id: novelId },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json(novel)
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

    const body = await request.json()

    // Check if user is the author or admin
    const novel = await prisma.novel.findUnique({
      where: { novel_id: novelId },
    })

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userRoleRaw = (session.user as any).role
    const userId = Number.parseInt((session.user as any).id)

    const userRole = typeof userRoleRaw === "string" ? userRoleRaw.toLowerCase() : "reader"

    if (novel.author_id !== userId && !["admin", "developer"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedNovel = await prisma.novel.update({
      where: { novel_id: novelId },
      data: body,
    })

    return NextResponse.json(updatedNovel)
  } catch (error) {
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
    const novel = await prisma.novel.findUnique({
      where: { novel_id: novelId },
    })

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userRoleRaw = (session.user as any).role
    const userId = Number.parseInt((session.user as any).id)

    const userRole = typeof userRoleRaw === "string" ? userRoleRaw.toLowerCase() : "reader"

    if (novel.author_id !== userId && !["admin", "developer"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.novel.delete({
      where: { novel_id: novelId },
    })

    return NextResponse.json({ message: "Novel deleted successfully" })
  } catch (error) {
    console.error("Error deleting novel:", error)
    return NextResponse.json({ error: "Failed to delete novel" }, { status: 500 })
  }
}
