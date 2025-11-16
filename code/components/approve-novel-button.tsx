"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

interface ApproveNovelButtonProps {
  novelId: string
  redirectTo?: string
}

export function ApproveNovelButton({ novelId, redirectTo }: ApproveNovelButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const complete = () => {
    setLoading(false)
    if (redirectTo) {
      router.push(redirectTo)
    }
    router.refresh()
  }

  const handleApprove = async () => {
    setLoading(true)
    await fetch(`/api/novels/${novelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ONGOING" }),
    })
    complete()
  }

  const handleReject = async () => {
    setLoading(true)
    await fetch(`/api/novels/${novelId}`, {
      method: "DELETE",
    })
    complete()
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleApprove} disabled={loading} size="sm" className="rounded-full">
        <Check className="mr-1 h-4 w-4" />
        Approve
      </Button>
      <Button onClick={handleReject} disabled={loading} variant="destructive" size="sm" className="rounded-full">
        <X className="mr-1 h-4 w-4" />
        Reject
      </Button>
    </div>
  )
}
