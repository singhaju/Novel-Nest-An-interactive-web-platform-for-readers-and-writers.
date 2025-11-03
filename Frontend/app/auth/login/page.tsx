"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

          {/* Login Form */}
          {isLogin ? (
            <div className="rounded-3xl bg-muted p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Welcome Back!</h1>
                <p className="text-muted-foreground">Login to Continue reading your novels</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
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
                  <div className="text-right">
                    <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                      Forgot Your Password?
                    </Link>
                  </div>
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-foreground py-6 text-background hover:bg-foreground/90"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/auth/signup">
              <Button className="w-full">Go to Signup</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
