import Link from "next/link"
import { getCurrentUser } from "@/lib/actions/auth"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"
import { apiClient, type Comment as ApiComment } from "@/lib/api-client"
import { canUseReaderFeatures, normalizeRole } from "@/lib/permissions"

interface CommentSectionProps {
  episodeId: number
}

export async function CommentSection({ episodeId }: CommentSectionProps) {
  const user = await getCurrentUser()

  const comments = await apiClient.getComments(episodeId)

  const currentUserId = user ? Number(user.id) : undefined
  const currentUserRole = normalizeRole(user?.role)
  const canComment = canUseReaderFeatures(currentUserRole)

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold">Comment ({comments?.length || 0})</h2>

      {canComment ? (
        <CommentForm episodeId={episodeId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {comments?.length ? (
          comments.map((comment: ApiComment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserRole={canComment ? currentUserRole : undefined}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Be the first to share your thoughts.</p>
        )}
      </div>
    </div>
  )
}
