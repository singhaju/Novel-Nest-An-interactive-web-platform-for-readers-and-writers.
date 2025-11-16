import Link from "next/link"
import { Star, BarChart3, User } from "lucide-react"
import { getCurrentUser } from "@/lib/actions/auth"
import { UserMenu } from "./user-menu"
import { SearchBar } from "./search-bar"

interface HeaderProps {
  initialQuery?: string
}

export async function Header({ initialQuery }: HeaderProps = {}) {
  const user = await getCurrentUser()
  const role = typeof user?.role === "string" ? user.role.toLowerCase() : undefined

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
        </div>
      </div>
    </header>
  )
}
