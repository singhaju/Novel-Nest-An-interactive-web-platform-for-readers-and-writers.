import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

// NextAuth API route handler
// Creates the dynamic route handler for all NextAuth endpoints
const handler = NextAuth(authConfig as any)

export const GET = handler
export const POST = handler
