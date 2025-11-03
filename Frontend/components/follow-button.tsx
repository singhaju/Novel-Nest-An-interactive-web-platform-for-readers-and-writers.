"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  authorId: string
}

export function FollowButton({ authorId }: FollowButtonProps) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkFollowing()
  }, [])

  const checkFollowing = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", authorId)
      .single()

    setFollowing(!!data)
  }

  const handleFollow = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", authorId)
      setFollowing(false)
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: authorId })
      setFollowing(true)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={following ? "default" : "outline"}
      className="w-full rounded-2xl"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {following ? "Following" : "Follow Author"}
    </Button>
  )
}
