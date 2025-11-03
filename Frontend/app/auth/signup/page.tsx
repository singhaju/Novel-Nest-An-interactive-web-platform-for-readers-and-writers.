"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [isLogin, setIsLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) throw error

      router.push("/")
      router.refresh()
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
                    Password
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
