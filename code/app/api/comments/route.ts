import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createComment, listCommentsForEpisode } from "@/lib/repositories/comments"
import { canUseReaderFeatures, getSessionRole } from "@/lib/permissions"

// GET /api/comments - Get comments for an episode
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const episodeId = searchParams.get("episodeId")

    if (!episodeId) {
      return NextResponse.json({ error: "Episode ID is required" }, { status: 400 })
    }

    const episodeNumericId = Number.parseInt(episodeId)
    if (Number.isNaN(episodeNumericId)) {
      return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 })
    }

    const comments = await listCommentsForEpisode(episodeNumericId)
    const repliesMap = new Map<number, any[]>()

    for (const comment of comments) {
      if (comment.parent_comment_id) {
        const arr = repliesMap.get(comment.parent_comment_id) ?? []
        arr.push(comment)
        repliesMap.set(comment.parent_comment_id, arr)
      }
    }

    const sortRepliesAsc = (items: any[]) => items.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())

    const buildComment = (comment: (typeof comments)[number]) => ({
      comment_id: comment.comment_id,
      episode_id: comment.episode_id,
      user_id: comment.user_id,
      parent_comment_id: comment.parent_comment_id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        user_id: comment.user_id,
        username: comment.username,
        profile_picture: comment.profile_picture,
      },
      replies: sortRepliesAsc(repliesMap.get(comment.comment_id) ?? []).map((reply) => ({
        comment_id: reply.comment_id,
        episode_id: reply.episode_id,
        user_id: reply.user_id,
        parent_comment_id: reply.parent_comment_id,
        content: reply.content,
        created_at: reply.created_at,
        user: {
          user_id: reply.user_id,
          username: reply.username,
          profile_picture: reply.profile_picture,
        },
      })),
    })

    const topLevel = comments
      .filter((comment) => comment.parent_comment_id === null)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .map(buildComment)

    return NextResponse.json(topLevel)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST /api/comments - Create a comment
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
    const { episodeId, content, parentCommentId } = body

    const episodeNumericId = Number.parseInt(String(episodeId))

    if (!episodeId || Number.isNaN(episodeNumericId) || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const comment = await createComment({
  episode_id: episodeNumericId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId || null,
    })

    return NextResponse.json({
      ...comment,
      user: {
        user_id: comment.user_id,
        username: comment.username,
        profile_picture: comment.profile_picture,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
