"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [isLogin, setIsLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const accountOptions = useMemo(
    () => [
      { label: "Reader", value: "READER" as const, description: "Bookmark, comment, and follow authors" },
      { label: "Writer", value: "WRITER" as const, description: "Unlock author dashboards & publish" },
    ],
    [],
  )
  type AccountRole = (typeof accountOptions)[number]["value"]
  const [role, setRole] = useState<AccountRole>("READER")
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
    const submittedRole = (formData.get("role") as string) || role
    const normalizedRole: AccountRole = submittedRole === "WRITER" ? "WRITER" : "READER"

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: normalizedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      router.push("/auth/login?registered=true")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      setError(message)
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
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-xl px-6 py-3 text-center font-medium transition-colors ${
                isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-xl px-6 py-3 text-center font-medium transition-colors ${
                !isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Signup
            </button>
          </div>

          {/* Signup Form */}
          {!isLogin ? (
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

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Account Type</Label>
                  <input type="hidden" name="role" value={role} />
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-background p-2">
                    {accountOptions.map((option) => {
                      const isSelected = role === option.value
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => setRole(option.value)}
                          aria-pressed={isSelected}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground hover:border-foreground/60"
                          }`}
                        >
                          <span className="block font-semibold">{option.label}</span>
                          <span className={`text-xs ${isSelected ? "text-background/80" : "text-muted-foreground"}`}>
                            {option.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
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
          ) : (
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
