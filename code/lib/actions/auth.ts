"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { error: data.error || "Registration failed" }
    }

    revalidatePath("/", "layout")
    redirect("/auth/login")
  } catch (error) {
    return { error: "Registration failed" }
  }
}

export async function signIn(formData: FormData) {
  // NextAuth handles sign in via the [...nextauth] route
  // This is just for compatibility with existing forms
  return { error: "Please use the login form" }
}

export async function signOut() {
  revalidatePath("/", "layout")
  redirect("/api/auth/signout")
}

export async function getCurrentUser() {
  const session = await auth()

  if (!session?.user) return null

  return {
    id: (session.user as any).id,
    username: session.user.name,
    email: session.user.email,
    role: typeof (session.user as any).role === "string" ? (session.user as any).role.toLowerCase() : "reader",
  }
}
