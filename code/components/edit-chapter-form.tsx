"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"

interface EditChapterFormProps {
  novelId: number
  episodeId: number
  chapterNumber: number
  defaultTitle: string
  defaultContent: string
}

export function EditChapterForm({
  novelId,
  episodeId,
  chapterNumber,
  defaultTitle,
  defaultContent,
}: EditChapterFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultTitle)
  const [content, setContent] = useState(defaultContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || "Failed to update episode")
      }

      router.push(`/author/novels/${novelId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this episode?")
    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/episodes/${episodeId}`, { method: "DELETE" })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.error || "Failed to delete episode")
      }

      router.push(`/author/novels/${novelId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="chapterNumber">Episode Number</Label>
        <Input id="chapterNumber" value={chapterNumber} disabled className="rounded-2xl bg-muted" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
          className="min-h-[400px] rounded-2xl font-mono"
        />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex flex-wrap gap-4">
        <Button type="button" variant="outline" className="flex-1 min-w-[120px] rounded-2xl" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" className="flex-1 min-w-[120px] rounded-2xl" onClick={handleDelete} disabled={loading}>
          Delete Episode
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 min-w-[160px] rounded-2xl">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
