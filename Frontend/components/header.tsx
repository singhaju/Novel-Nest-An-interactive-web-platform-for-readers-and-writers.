import Link from "next/link"
import { Search, Star, BarChart3, User } from "lucide-react"
import { getCurrentUser } from "@/lib/actions/auth"
import { UserMenu } from "./user-menu"

export async function Header() {
  const user = await getCurrentUser()

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
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search novels..."
            className="w-full rounded-full bg-muted px-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          {user && (user.role === "admin" || user.role === "developer") && (
            <Link href="/admin" className="text-foreground hover:text-muted-foreground">
              <BarChart3 className="h-6 w-6" />
            </Link>
          )}
          {user && user.role === "author" && (
            <Link href="/author" className="text-foreground hover:text-muted-foreground">
              <Star className="h-6 w-6" />
            </Link>
          )}
          {user ? (
            <UserMenu user={user} />
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
