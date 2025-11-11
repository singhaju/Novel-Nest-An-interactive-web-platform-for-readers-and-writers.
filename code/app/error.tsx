"use client"

import { useEffect } from "react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("App Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
        <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => reset()}
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
