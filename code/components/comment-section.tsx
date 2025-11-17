import { getCurrentUser } from "@/lib/actions/auth"
import { CommentForm } from "./comment-form"
import { CommentItem } from "./comment-item"
import { apiClient, type Comment as ApiComment } from "@/lib/api-client"

interface CommentSectionProps {
  episodeId: number
}

export async function CommentSection({ episodeId }: CommentSectionProps) {
  const user = await getCurrentUser()

  const comments = await apiClient.getComments(episodeId)

  const currentUserId = user ? Number(user.id) : undefined

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold">Comment ({comments?.length || 0})</h2>

      {user && <CommentForm episodeId={episodeId} />}

      <div className="mt-6 space-y-4">
        {comments?.length ? (
          comments.map((comment: ApiComment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserRole={user?.role}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Be the first to share your thoughts.</p>
        )}
      </div>
    </div>
  )
}
