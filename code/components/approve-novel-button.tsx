"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApproveNovelButtonProps {
  novelId: string
  redirectTo?: string
}

export function ApproveNovelButton({ novelId, redirectTo }: ApproveNovelButtonProps) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null)
  const router = useRouter()

  const complete = () => {
    setLoading(null)
    if (redirectTo) {
      router.push(redirectTo)
    }
    router.refresh()
  }

  const mutate = async (status: "ONGOING" | "DENIAL") => {
    setLoading(status === "ONGOING" ? "approve" : "deny")
    try {
      const response = await fetch(`/api/novels/${novelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to update novel status")
      }

      complete()
    } catch (error) {
      console.error("Failed to update novel", error)
      alert(error instanceof Error ? error.message : "Failed to update novel status")
      setLoading(null)
    }
  }

  const approveClasses = cn(
    "inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100",
    loading && loading !== "approve" && "opacity-60",
  )

  const denyClasses = cn(
    "inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-100",
    loading && loading !== "deny" && "opacity-60",
  )

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={approveClasses}
        disabled={loading !== null}
        onClick={() => mutate("ONGOING")}
      >
        <Check className="mr-1 h-4 w-4" />
        {loading === "approve" ? "Approving..." : "Approve"}
      </button>
      <button
        type="button"
        className={denyClasses}
        disabled={loading !== null}
        onClick={() => mutate("DENIAL")}
      >
        <X className="mr-1 h-4 w-4" />
        {loading === "deny" ? "Denying..." : "Deny"}
      </button>
    </div>
  )
}
