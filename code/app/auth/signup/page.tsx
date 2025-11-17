"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      router.push("/auth/login?registered=true")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="text-xl font-bold">N</span>
          </div>
          <span className="text-xl font-bold">NovelNest</span>
        </Link>

        <div className="mx-auto max-w-md">
          {/* Tab Buttons */}
          <div className="mb-6 flex rounded-2xl bg-muted p-2">
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="flex-1 rounded-xl px-6 py-3 text-center font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-background px-6 py-3 text-center font-medium text-foreground shadow-sm"
              aria-current="page"
            >
              Signup
            </button>
          </div>

          <div className="rounded-3xl bg-muted p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
              <p className="text-muted-foreground">Sign up to start your reading journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  className="rounded-2xl bg-background px-6 py-6 text-center placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your Email"
                  required
                  className="rounded-2xl bg-background px-6 py-6 text-center placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="rounded-2xl bg-background px-6 py-6 text-center placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  className="rounded-2xl bg-background px-6 py-6 text-center placeholder:text-muted-foreground"
                />
              </div>

              {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-foreground py-6 text-background hover:bg-foreground/90"
              >
                {loading ? "Creating account..." : "Signup"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
