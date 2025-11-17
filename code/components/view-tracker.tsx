"use client"

import { useEffect } from "react"

interface ViewTrackerProps {
  novelId: number
  delayMs?: number
}

export function ViewTracker({ novelId, delayMs = 60_000 }: ViewTrackerProps) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    timer = setTimeout(() => {
      if (cancelled) return
      fetch(`/api/novels/${novelId}/views`, { method: "POST" }).catch((error) => {
        console.error("Failed to record novel view", error)
      })
    }, delayMs)

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [novelId, delayMs])

  return null
}
