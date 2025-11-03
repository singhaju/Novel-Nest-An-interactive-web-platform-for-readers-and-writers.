"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function CreateNovelForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    const summary = formData.get("summary") as string
    const genre = formData.get("genre") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("novels")
        .insert({
          title,
          summary,
          genre,
          author_id: user.id,
          status: "pending_approval",
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/author/novels/${data.id}`)
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
        <Label htmlFor="title">Novel Title</Label>
        <Input id="title" name="title" placeholder="Enter novel title" required className="rounded-2xl" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre">Genre</Label>
        <Select name="genre" required>
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
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          placeholder="Write a brief summary of your novel"
          required
          className="min-h-[150px] rounded-2xl"
        />
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
