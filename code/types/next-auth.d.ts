import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: number
      username: string
      email: string
  role: "reader" | "writer" | "admin" | "developer" | "superadmin"
      profile_picture?: string | null
      bio?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: number
    username: string
    email: string
  role: "reader" | "writer" | "admin" | "developer" | "superadmin"
    profile_picture?: string | null
    bio?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number
  role: "reader" | "writer" | "admin" | "developer" | "superadmin"
  }
}
