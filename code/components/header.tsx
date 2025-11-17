import Link from "next/link"
import { Star, BarChart3, User } from "lucide-react"

import { getCurrentUser } from "@/lib/actions/auth"
import { auth } from "@/lib/auth"
import { getSessionRole } from "@/lib/permissions"
import { UserMenu } from "./user-menu"
import { SearchBar } from "./search-bar"

interface HeaderProps {
  initialQuery?: string
}

export async function Header({ initialQuery }: HeaderProps = {}) {
  const session = await auth()
  const user = await getCurrentUser(session)
  const role = typeof user?.role === "string" ? user.role.toLowerCase() : undefined
  const appRole = getSessionRole(session)
  const roleLabel = user ? role ?? "reader" : "guest"

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto flex items-center gap-4 px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="text-xl font-bold">N</span>
          </div>
          <span className="text-xl font-bold">NovelNest</span>
        </Link>

        {/* Search Bar */}
        <SearchBar initialQuery={initialQuery} />

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
            <span className="uppercase tracking-wide text-[10px] text-muted-foreground/80">Role</span>
            <span className="capitalize text-foreground">{roleLabel}</span>
          </div>
          {user && role && ["admin", "superadmin", "developer"].includes(role) && (
            <Link
              href={role === "developer" ? "/developer" : "/admin"}
              className="text-foreground hover:text-muted-foreground"
            >
              <BarChart3 className="h-6 w-6" />
            </Link>
          )}
          {user && role && ["author", "writer", "developer", "superadmin"].includes(role) && (
            <Link href="/author" className="text-foreground hover:text-muted-foreground">
              <Star className="h-6 w-6" />
            </Link>
          )}
          {user ? (
            <UserMenu user={user as any} />
          ) : (
            <Link href="/auth/login" className="text-foreground hover:text-muted-foreground">
              <User className="h-8 w-8" />
            </Link>
          )}
          {!user && (
            <Link href="/auth/signup" className="hidden text-xs font-medium text-primary hover:text-primary/80 sm:inline-flex">
              Become a reader
            </Link>
          )}
          {appRole === "reader" && (
            <Link
              href="/author/novels/create"
              className="hidden text-xs font-medium text-primary hover:text-primary/80 sm:inline-flex"
            >
              Write a story
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
