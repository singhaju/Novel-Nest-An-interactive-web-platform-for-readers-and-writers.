"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface BioFormProps {
  initialBio?: string | null
  className?: string
}

export function BioForm({ initialBio, className }: BioFormProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(initialBio ?? "")
  const [draft, setDraft] = useState(initialBio ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedSaved = bio.trim()
  const normalizedDraft = draft.trim()
  const hasChanges = normalizedDraft !== normalizedSaved

  useEffect(() => {
    if (!isEditing) {
      const nextBio = (initialBio ?? "").trim()
      setBio(nextBio)
      setDraft(nextBio)
    }
  }, [initialBio, isEditing])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditing])

  const handleStartEditing = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setDraft(bio)
    setIsEditing(false)
    setError(null)
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (submitting || !hasChanges) {
      if (!hasChanges) {
        setIsEditing(false)
      }
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: normalizedDraft }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update bio")
      }

      const nextBio = normalizedDraft
      setBio(nextBio)
      setDraft(nextBio)
      setIsEditing(false)
      router.refresh()
    } catch (submitError) {
      console.error("Failed to update bio:", submitError)
      setError(submitError instanceof Error ? submitError.message : "Failed to update bio")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!isEditing ? (
        <button
          type="button"
          onClick={handleStartEditing}
          className="group w-full text-left"
        >
          <p
            className={cn(
              "leading-relaxed transition-colors",
              normalizedSaved ? "text-muted-foreground" : "italic text-muted-foreground/30"
            )}
          >
            {normalizedSaved || "Share a short introduction so readers know you better."}
          </p>
          <span className="mt-1 block text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Click to edit bio
          </span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault()
                handleCancel()
              }
            }}
            placeholder="Tell readers a bit about yourself..."
            className="rounded-2xl border border-border bg-background"
            maxLength={2000}
            rows={4}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{draft.length}/2000</span>
            {!hasChanges && !submitting ? <span>Edit in progress</span> : null}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {hasChanges ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl border border-primary/30 bg-primary text-primary-foreground font-semibold shadow-sm transition hover:border-primary hover:bg-primary/90 hover:shadow-lg sm:w-auto"
              >
                {submitting ? "Saving..." : "Save bio"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-2xl sm:w-auto"
                disabled={submitting}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p className="text-right text-xs text-muted-foreground">Press Esc to cancel editing</p>
          )}
        </form>
      )}
    </div>
  )
}
