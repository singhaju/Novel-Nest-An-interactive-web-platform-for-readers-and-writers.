"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export function CreateNovelForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genre, setGenre] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!genre) {
      setError("Please select a genre")
      setLoading(false)
      return
    }

  const formData = new FormData(e.currentTarget)
  formData.set("tags", genre)

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

      <div className="space-y-2">
        <Label htmlFor="genre">Genre</Label>
        <Select name="genre" value={genre} onValueChange={setGenre} required>
          <SelectTrigger className="rounded-2xl">
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fantasy">Fantasy</SelectItem>
            <SelectItem value="Romance">Romance</SelectItem>
            <SelectItem value="Mystery">Mystery</SelectItem>
            <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
            <SelectItem value="Horror">Horror</SelectItem>
            <SelectItem value="Adventure">Adventure</SelectItem>
          </SelectContent>
        </Select>
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
