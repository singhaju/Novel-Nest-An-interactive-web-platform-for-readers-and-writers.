"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Profile Error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">Profile Error</h2>
          <p className="text-muted-foreground">{error.message || "Failed to load profile."}</p>
          <button
            onClick={() => reset()}
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  )
}
