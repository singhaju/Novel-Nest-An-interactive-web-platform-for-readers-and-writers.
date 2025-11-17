import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteComment, findCommentById, updateCommentContent } from "@/lib/repositories/comments"

async function resolveParams(context: any) {
  return context?.params instanceof Promise ? await context.params : context?.params
}

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.toLowerCase() : "reader"
}

function canModerate(role: string) {
  return ["admin", "developer", "superadmin"].includes(role)
}

export async function PATCH(request: NextRequest, context: any) {
  const params = await resolveParams(context)
  const commentId = Number.parseInt(params?.id)

  if (Number.isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid comment id" }, { status: 400 })
  }

  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await findCommentById(commentId)

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 })
    }

    const role = normalizeRole((session.user as any).role)

    if (comment.user_id !== userId && !canModerate(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const content = typeof body?.content === "string" ? body.content.trim() : ""

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const updatedComment = await updateCommentContent(commentId, content)

    if (!updatedComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const params = await resolveParams(context)
  const commentId = Number.parseInt(params?.id)

  if (Number.isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid comment id" }, { status: 400 })
  }

  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const comment = await findCommentById(commentId)

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 })
    }

    const role = normalizeRole((session.user as any).role)

    if (comment.user_id !== userId && !canModerate(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

  await deleteComment(commentId)

    return NextResponse.json({ message: "Comment deleted" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
