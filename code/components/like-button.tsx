"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"

interface LikeButtonProps {
  novelId: number
  initialLiked: boolean
  initialLikes?: number
}

export function LikeButton({ novelId, initialLiked, initialLikes = 0 }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likes, setLikes] = useState(initialLikes)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const handleLike = async () => {
    if (!session?.user) {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/novel/${novelId}`
      const params = new URLSearchParams({ callbackUrl })
      toast({ title: "Sign in required", description: "Log in to like this novel." })
      router.push(`/auth/login?${params.toString()}`)
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId }),
      })

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}))
        throw new Error(errorPayload?.error || "Failed to toggle like")
      }

      const data: { action?: "added" | "removed"; likes?: number } = await res.json()

      if (data.action === "added") {
        setLiked(true)
        setLikes((current) => (typeof data.likes === "number" ? data.likes : Math.max(current + 1, 1)))
        toast({ title: "Added to likes", description: "This story is now in your liked list." })
      } else if (data.action === "removed") {
        setLiked(false)
        setLikes((current) => (typeof data.likes === "number" ? data.likes : Math.max(current - 1, 0)))
        toast({ title: "Like removed", description: "You can always like it again later." })
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to toggle like:", error)
      toast({ title: "Something went wrong", description: "We couldn't update your like. Please try again." })
    } finally {
      setLoading(false)
    }
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
      <span className="ml-1 text-xs text-muted-foreground">({likes})</span>
    </Button>
  )
}
