"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  novelId: number
  initialReview?: {
    review_id: number
    rating: number
    comment?: string | null
  }
  className?: string
}

export function ReviewForm({ novelId, initialReview, className }: ReviewFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(initialReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(initialReview?.comment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = Boolean(initialReview)

  const displayRating = hoverRating || rating

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating)
      setComment(initialReview.comment ?? "")
    } else {
      setRating(0)
      setComment("")
    }
    setHoverRating(0)
  }, [initialReview?.review_id, initialReview?.rating, initialReview?.comment])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (submitting) return

    if (rating === 0) {
      setError("Please select a rating before submitting.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const trimmedComment = comment.trim()
      const normalizedComment = trimmedComment.length > 0 ? trimmedComment : null

      if (isEditing && initialReview) {
        await apiClient.updateReview(initialReview.review_id, {
          rating,
          comment: normalizedComment,
        })
      } else {
        await apiClient.createReview({
          novelId,
          rating,
          comment: normalizedComment ?? undefined,
        })

        setComment("")
        setRating(0)
        setHoverRating(0)
      }

      setIsOpen(false)
      router.refresh()
    } catch (submitError) {
      console.error("Failed to submit review:", submitError)
      setError(submitError instanceof Error ? submitError.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Button
        type="button"
        size="lg"
        className="w-full rounded-2xl border border-primary/30 bg-primary text-primary-foreground font-semibold shadow-sm transition hover:border-primary hover:bg-primary/90 hover:shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "Cancel" : isEditing ? "Edit your review" : "Post a review"}
      </Button>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isEditing ? "Update your rating" : "Your rating"}
            </p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => {
                const starValue = index + 1
                const filled = starValue <= displayRating

                return (
                  <button
                    key={starValue}
                    type="button"
                    className={cn(
                      "rounded-lg p-1 transition",
                      filled ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                    )}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
                  >
                    <Star className={cn("h-6 w-6", filled && "fill-current")} />
                  </button>
                )
              })}
              <span className="ml-3 text-sm text-muted-foreground">{rating ? `${rating} / 5` : "Select"}</span>
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
              {isEditing ? "Update your thoughts" : "Share your thoughts (optional)"}
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What did you think about this novel?"
              className="mt-2 min-h-[120px] rounded-2xl"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl border border-primary/30 bg-primary text-primary-foreground font-semibold shadow-sm transition hover:border-primary hover:bg-primary/90 hover:shadow-lg sm:w-auto"
            >
              {submitting ? (isEditing ? "Saving..." : "Submitting...") : isEditing ? "Save changes" : "Submit review"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-2xl sm:w-auto"
              disabled={submitting}
              onClick={() => {
                setIsOpen(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
