import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { CommentForm } from "./comment-form"
import { formatDistanceToNow } from "date-fns"

interface CommentSectionProps {
  chapterId: string
}

export async function CommentSection({ chapterId }: CommentSectionProps) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      user:profiles(username, avatar_url)
    `)
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false })

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4">Comment ({comments?.length || 0})</h2>

      {user && <CommentForm chapterId={chapterId} />}

      <div className="mt-6 space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {comment.user.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{comment.user.username}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
