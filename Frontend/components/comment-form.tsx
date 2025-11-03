"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CommentFormProps {
  chapterId: string
}

export function CommentForm({ chapterId }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    await supabase.from("comments").insert({
      chapter_id: chapterId,
      user_id: user.id,
      content: content.trim(),
    })

    setContent("")
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-[100px] rounded-2xl"
      />
      <Button type="submit" disabled={loading || !content.trim()} className="rounded-2xl">
        Post Comment
      </Button>
    </form>
  )
}
