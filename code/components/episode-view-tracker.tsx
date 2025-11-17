"use client"

import { useEffect, useRef } from "react"
import { apiClient } from "@/lib/api-client"

interface EpisodeViewTrackerProps {
  novelId: number
  episodeId: number
  delayMs?: number
}

export function EpisodeViewTracker({ novelId, episodeId, delayMs = 10_000 }: EpisodeViewTrackerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasIncrementedRef = useRef(false)

  useEffect(() => {
    if (!novelId || !episodeId || hasIncrementedRef.current) {
      return
    }

    timerRef.current = setTimeout(async () => {
      try {
        await apiClient.incrementNovelView(novelId)
        hasIncrementedRef.current = true
      } catch (error) {
        console.error("Failed to increment novel view", error)
      }
    }, delayMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [novelId, episodeId, delayMs])

  return null
}
