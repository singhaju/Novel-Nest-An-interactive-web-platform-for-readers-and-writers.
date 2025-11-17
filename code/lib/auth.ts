// /code/lib/auth.ts
import NextAuth from "next-auth"
import { getServerSession } from "next-auth"
import CredentialsProvider,  { type CredentialsConfig } from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { hashPassword, verifyPassword } from "./security"
import { findUserByEmail, findUserById, updateUserPassword } from "./repositories/users"
import { normalizeProfileImageUrl } from "./utils"
import { ensureUserRole } from "@/lib/permissions"

// ✅ Define configuration as an object
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Local Credentials login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-expect-error - NextAuth type inference bug with CredentialsProvider
  async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await findUserByEmail(credentials.email)

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const { valid, needsMigration } = await verifyPassword(credentials.password, user.password)

        if (!valid) {
          throw new Error("Invalid credentials")
        }

        if (needsMigration) {
          const upgradedHash = hashPassword(credentials.password)
          await updateUserPassword(user.user_id, upgradedHash)
        }

        const normalizedRole = ensureUserRole(user.role)

        return {
          id: user.user_id.toString(),
          email: user.email,
          name: user.username,
          role: normalizedRole,
        }
      },
    }),

    // Google OAuth login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = ensureUserRole((user as any).role)
  const normalizedProfile = normalizeProfileImageUrl((user as any).profile_picture)
  token.profile_picture = normalizedProfile ?? token.profile_picture
      }
      if (token.role) {
        token.role = ensureUserRole(token.role)
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = ensureUserRole(token.role)

        const userId = typeof token.id === "string" ? Number.parseInt(token.id, 10) : token.id

        if (!Number.isNaN(userId)) {
          const dbUser = await findUserById(userId)

          if (dbUser) {
            const normalizedRole = ensureUserRole(dbUser.role)
            session.user.role = normalizedRole
            token.role = normalizedRole
            session.user.username = dbUser.username
            session.user.email = dbUser.email
            const normalizedProfile = normalizeProfileImageUrl(dbUser.profile_picture ?? undefined)
            session.user.profile_picture = normalizedProfile ?? undefined
            session.user.bio = dbUser.bio
            token.profile_picture = normalizedProfile ?? token.profile_picture
          }
        }

        if (!session.user.profile_picture && typeof token.profile_picture === "string") {
          session.user.profile_picture = token.profile_picture
        }
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },

  debug: false,
}
// Provide legacy named export expected by some components
export const authOptions = authConfig as any;


// ✅ Correct new App Router export (NextAuth v5+)
// NextAuth(...) returns helpers for wiring the API route. We purposely avoid
// re-exporting a non-callable `auth` value from NextAuth here because some
// callers expect `auth()` to be a callable server helper returning the
// current session. Provide a small wrapper `auth()` below that uses
// `getServerSession` which works inside Server Components / RSC.
export const { handlers, signIn, signOut } = NextAuth(authConfig as any) as any

// Callable helper used across the app to get the current session in server
// components and server actions. Mirrors the simple `auth()` API used in the
// codebase.
export async function auth(): Promise<any> {
  // Return `any` to keep callers flexible (many files expect `session.user` to
  // exist and access arbitrary properties). Narrowing types here requires
  // aligning all call sites with the NextAuth `Session` types.
  return (await getServerSession(authOptions as any)) as any
}


