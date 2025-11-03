"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Bookmark } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WishlistButtonProps {
  novelId: string
  initialWishlisted: boolean
}

export function WishlistButton({ novelId, initialWishlisted }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleWishlist = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (wishlisted) {
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("novel_id", novelId)
      setWishlisted(false)
    } else {
      await supabase.from("wishlists").insert({ user_id: user.id, novel_id: novelId })
      setWishlisted(true)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      onClick={handleWishlist}
      disabled={loading}
      variant={wishlisted ? "default" : "outline"}
      className="w-full rounded-2xl"
    >
      <Bookmark className={`mr-2 h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
      {wishlisted ? "In Wishlist" : "Wishlist"}
    </Button>
  )
}
