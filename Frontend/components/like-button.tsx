"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface LikeButtonProps {
  novelId: string
  initialLiked: boolean
}

export function LikeButton({ novelId, initialLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLike = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("novel_id", novelId)
      setLiked(false)
    } else {
      await supabase.from("likes").insert({ user_id: user.id, novel_id: novelId })
      setLiked(true)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      onClick={handleLike}
      disabled={loading}
      variant={liked ? "default" : "outline"}
      className="w-full rounded-2xl"
    >
      <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {liked ? "Liked" : "Like"}
    </Button>
  )
}
