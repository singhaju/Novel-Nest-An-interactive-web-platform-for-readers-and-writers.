"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
        credentials: "include",
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
      <button
        type="button"
        className={cn(
          "inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100",
          loading && loading !== "approve" && "opacity-60",
        )}
        disabled={loading !== null}
        onClick={() => review("APPROVED")}
      >
        <Check className="mr-1 h-4 w-4" />
        {loading === "approve" ? "Approving..." : "Approve"}
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-100",
          loading && loading !== "deny" && "opacity-60",
        )}
        disabled={loading !== null}
        onClick={() => review("DENIAL")}
      >
        <X className="mr-1 h-4 w-4" />
        {loading === "deny" ? "Denying..." : "Deny"}
      </button>
    </div>
  )
}
