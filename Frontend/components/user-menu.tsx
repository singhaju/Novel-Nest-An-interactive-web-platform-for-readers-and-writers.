"use client"

import { User } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/types/database"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"

interface UserMenuProps {
  user: Profile
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-foreground hover:text-muted-foreground">
        <User className="h-8 w-8" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        {user.role === "author" && (
          <DropdownMenuItem asChild>
            <Link href="/author">Author Dashboard</Link>
          </DropdownMenuItem>
        )}
        {(user.role === "admin" || user.role === "developer") && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin Dashboard</Link>
          </DropdownMenuItem>
        )}
        {user.role === "developer" && (
          <DropdownMenuItem asChild>
            <Link href="/developer">Developer Dashboard</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
