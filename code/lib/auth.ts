// /code/lib/auth.ts
import NextAuth from "next-auth"
import { getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { hashPassword, verifyPassword } from "./security"
import { findUserById, findUserByUsernameOrEmail, updateUserPassword } from "./repositories/users"
import { normalizeProfileImageUrl } from "./utils"

// ✅ Define configuration as an object
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Local Credentials login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // @ts-expect-error - NextAuth type inference bug with CredentialsProvider
  async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const identifier = credentials.identifier.trim()

        if (!identifier) {
          throw new Error("Invalid credentials")
        }

        const user = await findUserByUsernameOrEmail(identifier)

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

        if (user.is_banned) {
          throw new Error("This account has been banned")
        }

        const normalizedRole = typeof user.role === "string" ? user.role.toLowerCase() : "reader"

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
        token.role = typeof user.role === "string" ? user.role.toLowerCase() : token.role ?? "reader"
        const normalizedProfile = normalizeProfileImageUrl((user as any).profile_picture)
        token.profile_picture = normalizedProfile ?? token.profile_picture
      } else if (token?.id) {
        const userId = typeof token.id === "string" ? Number.parseInt(token.id, 10) : token.id

        if (!Number.isNaN(userId)) {
          const dbUser = await findUserById(userId)

          if (dbUser) {
            token.role = typeof dbUser.role === "string" ? dbUser.role.toLowerCase() : token.role ?? "reader"
            const normalizedProfile = normalizeProfileImageUrl(dbUser.profile_picture ?? undefined)
            token.profile_picture = normalizedProfile ?? token.profile_picture
          }
        }
      }

      if (token.role && typeof token.role === "string") {
        token.role = token.role.toLowerCase()
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = typeof token.role === "string" ? token.role.toLowerCase() : "reader"

        const userId = typeof token.id === "string" ? Number.parseInt(token.id, 10) : token.id

        if (!Number.isNaN(userId)) {
          const dbUser = await findUserById(userId)

          if (dbUser?.is_banned) {
            return null
          }

          if (dbUser) {
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


