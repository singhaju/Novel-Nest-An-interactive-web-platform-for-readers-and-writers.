"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface WishlistButtonProps {
  novelId: number
  initialWishlisted: boolean
}

export function WishlistButton({ novelId, initialWishlisted }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleWishlist = async () => {
    if (!session?.user) {
      router.push("/auth/login")
      return
    }

    setLoading(true)

    try {
      const result = await apiClient.toggleWishlist(novelId)
      setWishlisted(result.action === "added")
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle wishlist:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleWishlist}
      disabled={loading}
      variant={wishlisted ? "default" : "outline"}
      className="w-full rounded-2xl"
    >
      {wishlisted ? "In Wishlist" : "Wishlist"}
    </Button>
  )
}
