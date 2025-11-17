"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { DEFAULT_VISIBLE_GENRE_COUNT, GENRE_OPTIONS } from "@/lib/genres"

function toggleSelection(current: string[], value: string, checked: boolean): string[] {
  if (checked) {
    return current.includes(value) ? current : [...current, value]
  }
  return current.filter((item) => item !== value)
}

export function CreateNovelForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [showAllGenres, setShowAllGenres] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (genres.length === 0) {
      setError("Please select at least one genre")
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set("tags", JSON.stringify(genres))

    try {
      const novel = await apiClient.createNovel(formData)
      router.push(`/author/novels/${novel.novel_id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create novel")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Novel Title</Label>
        <Input id="title" name="title" placeholder="Enter novel title" required className="rounded-2xl" />
      </div>

      <div className="space-y-3">
        <Label>Genres</Label>
        <p className="text-sm text-muted-foreground">Select all genres that apply to your novel.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(showAllGenres ? GENRE_OPTIONS : GENRE_OPTIONS.slice(0, DEFAULT_VISIBLE_GENRE_COUNT)).map((option) => {
            const checked = genres.includes(option)
            return (
              <label
                key={option}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    setGenres((current) => toggleSelection(current, option, value === true))
                  }
                />
                <span className="font-medium">{option}</span>
              </label>
            )
          })}
        </div>
        {GENRE_OPTIONS.length > DEFAULT_VISIBLE_GENRE_COUNT && (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAllGenres((prev) => !prev)}
              className="mt-2 rounded-2xl"
            >
              {showAllGenres ? "Hide genres" : "View more genres"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Summary</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Write a brief summary of your novel"
          required
          className="min-h-[150px] rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">Cover Image (Optional)</Label>
        <Input id="coverImage" name="coverImage" type="file" accept="image/*" className="rounded-2xl" />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 rounded-2xl">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 rounded-2xl">
          {loading ? "Creating..." : "Create Novel"}
        </Button>
      </div>
    </form>
  )
}
