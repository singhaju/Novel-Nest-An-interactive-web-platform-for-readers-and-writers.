"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

import { apiClient, type Comment as ApiComment } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface CommentItemProps {
  comment: ApiComment
  currentUserId?: number
  currentUserRole?: string
  depth?: number
}

const privilegedRoles = ["admin", "developer", "superadmin"]

export function CommentItem({ comment, currentUserId, currentUserRole, depth = 0 }: CommentItemProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setEditedContent(comment.content)
  }, [comment.content])

  const role = typeof currentUserRole === "string" ? currentUserRole.toLowerCase() : "reader"
  const isOwner = typeof currentUserId === "number" && currentUserId === comment.user.user_id
  const canModerate = privilegedRoles.includes(role)
  const canEdit = isOwner
  const canDelete = isOwner || canModerate

  const initials = comment.user?.username?.[0]?.toUpperCase() || "?"

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = editedContent.trim()

    if (!content || busy) return

    setBusy(true)
    try {
      await apiClient.updateComment(comment.comment_id, { content })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update comment:", error)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (busy) return
    if (!window.confirm("Delete this comment?")) return

    setBusy(true)
    try {
      await apiClient.deleteComment(comment.comment_id)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete comment:", error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("flex gap-4", depth > 0 && "ml-8")}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-primary-foreground",
          depth > 0 ? "h-8 w-8 text-sm" : "h-12 w-12"
        )}
      >
        {initials}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className={cn(depth > 0 ? "text-sm font-medium" : "font-semibold")}>{comment.user.username}</span>
          <span className={cn("text-muted-foreground", depth > 0 ? "text-xs" : "text-sm")}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(event) => setEditedContent(event.target.value)}
              className="min-h-[120px]"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={busy || !editedContent.trim()}>Save</Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className={cn("text-muted-foreground", depth > 0 ? "text-sm" : undefined)}>{comment.content}</p>
        )}

        {(canEdit || canDelete) && !isEditing && (
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
            {canEdit && (
              <Button type="button" variant="ghost" size="sm" className="h-8 px-3" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-destructive"
                onClick={handleDelete}
                disabled={busy}
              >
                Delete
              </Button>
            )}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.comment_id}
                comment={reply}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
