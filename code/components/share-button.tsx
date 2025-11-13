"use client"

import { useCallback, useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
  title: string
  path: string
  className?: string
}

export function ShareButton({ title, path, className }: ShareButtonProps) {
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = useCallback(async () => {
    if (isSharing) {
      return
    }

    try {
      setIsSharing(true)
      const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title,
            text: `Check out ${title} on Novel Nest`,
            url,
          })
          toast({ title: "Link shared", description: "Thanks for spreading the word." })
          return
        } catch (error: unknown) {
          // Ignore abort errors and fall back to copy behaviour
          if (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "AbortError") {
            return
          }
          console.warn("navigator.share failed, falling back to clipboard", error)
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        toast({ title: "Link copied", description: "Share it with your friends." })
      } else {
        toast({
          title: "Share unavailable",
          description: "Your browser does not support copying links automatically.",
        })
      }
    } catch (error) {
      console.error("Share action failed", error)
      toast({ title: "Could not share", description: "Please try again or copy the URL manually." })
    } finally {
      setIsSharing(false)
    }
  }, [isSharing, path, title, toast])

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleShare}
      disabled={isSharing}
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share
    </Button>
  )
}
