"use client"

import { useEffect } from "react"
import Link from "next/link"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Profile Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Novel Nest
          </Link>
          <button
            onClick={() => reset()}
            className="rounded-lg border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Retry
          </button>
        </div>
      </header>

      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">Profile Error</h2>
          <p className="text-muted-foreground">{error.message || "Failed to load profile."}</p>
          <Link
            href="/profile"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to profile
          </Link>
        </div>
      </main>
    </div>
  )
}
