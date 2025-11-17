"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Check, X } from "lucide-react"

type EpisodeReviewActionsProps = {
  episodeId: number | string
  redirectTo?: string
}

export function EpisodeReviewActions({ episodeId, redirectTo }: EpisodeReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null)

  const complete = () => {
    setLoading(null)
    if (redirectTo) {
      router.push(redirectTo)
    }
    router.refresh()
  }

  const review = async (decision: "APPROVED" | "DENIAL") => {
    setLoading(decision === "APPROVED" ? "approve" : "deny")
    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to update episode status")
      }

      complete()
    } catch (error) {
      console.error("Episode review failed", error)
      setLoading(null)
      // Surface minimal feedback for now; full toast system already exists in project
      alert((error as Error).message)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="rounded-full"
        disabled={loading !== null}
        onClick={() => review("APPROVED")}
      >
        <Check className="mr-1 h-4 w-4" />
        {loading === "approve" ? "Approving..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="rounded-full"
        disabled={loading !== null}
        onClick={() => review("DENIAL")}
      >
        <X className="mr-1 h-4 w-4" />
        {loading === "deny" ? "Denying..." : "Deny"}
      </Button>
    </div>
  )
}
