import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/lib/types/database"

declare module "next-auth" {
  interface Session {
    user: {
      id: number
      username: string
      email: string
      role: UserRole
      profile_picture?: string | null
      bio?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: number
    username: string
    email: string
    role: UserRole
    profile_picture?: string | null
    bio?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number
    role: UserRole
  }
}
