"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { useRouter } from "next/navigation"

interface CreateChapterFormProps {
  novelId: string
  chapterNumber: number
}

export function CreateChapterForm({ novelId, chapterNumber }: CreateChapterFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const content = formData.get("content") as string

    try {
      const response = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          novelId: Number.parseInt(novelId, 10),
          title,
          content,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create chapter")
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
        <Label htmlFor="chapterNumber">Chapter Number</Label>
        <Input id="chapterNumber" value={chapterNumber} disabled className="rounded-2xl bg-muted" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Chapter Title</Label>
        <Input id="title" name="title" placeholder="Enter chapter title" required className="rounded-2xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Write your chapter content here..."
          required
          className="min-h-[400px] rounded-2xl font-mono"
        />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 rounded-2xl">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 rounded-2xl">
          {loading ? "Publishing..." : "Publish Chapter"}
        </Button>
      </div>
    </form>
  )
}
