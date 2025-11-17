import type { UserRole } from "@/lib/types/database"

export type AppRole = "non-user" | UserRole

const ROLE_ORDER: AppRole[] = ["non-user", "reader", "writer", "admin", "developer", "superadmin"]

const ROLE_RANK: Record<AppRole, number> = ROLE_ORDER.reduce((acc, role, index) => {
  acc[role] = index
  return acc
}, {} as Record<AppRole, number>)

const ROLE_ALIASES: Record<string, AppRole> = {
  author: "writer",
}

export function normalizeRole(value: unknown): AppRole {
  if (typeof value !== "string") {
    return "non-user"
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return "non-user"
  }

  const alias = ROLE_ALIASES[normalized]
  if (alias) {
    return alias
  }

  return Object.prototype.hasOwnProperty.call(ROLE_RANK, normalized)
    ? (normalized as AppRole)
    : "non-user"
}

export function ensureUserRole(value: unknown): UserRole {
  const normalized = normalizeRole(value)
  return (normalized === "non-user" ? "reader" : normalized) as UserRole
}

export function getSessionRole(session: { user?: { role?: string | null } } | null | undefined): AppRole {
  if (!session?.user) {
    return "non-user"
  }

  return ensureUserRole((session.user as any).role)
}

export function hasMinimumRole(role: AppRole, minimum: AppRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

export function canUseReaderFeatures(role: AppRole): boolean {
  return hasMinimumRole(role, "reader")
}

export function isGuestRole(role: AppRole): boolean {
  return role === "non-user"
}
