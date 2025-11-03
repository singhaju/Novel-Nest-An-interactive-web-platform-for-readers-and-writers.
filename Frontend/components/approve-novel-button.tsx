"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

interface ApproveNovelButtonProps {
  novelId: string
}

export function ApproveNovelButton({ novelId }: ApproveNovelButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    setLoading(true)
    await supabase.from("novels").update({ status: "ongoing" }).eq("id", novelId)

    setLoading(false)
    router.refresh()
  }

  const handleReject = async () => {
    setLoading(true)
    await supabase.from("novels").delete().eq("id", novelId)

    setLoading(false)
    router.refresh()
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
