import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { recordUserCreationToSheet } from "@/lib/google-sheets"
import type { UserRole } from "@/lib/repositories/users"
import { createUser, findUserByEmailOrUsername } from "@/lib/repositories/users"
import { hashPassword } from "@/lib/security"

const ROLE_PERMISSIONS: Record<string, readonly UserRole[]> = {
  developer: ["developer"],
  admin: ["admin"],
  superadmin: ["reader", "writer", "admin", "developer", "superadmin"],
}

function normalizeRole(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }
  return value.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actorRole = normalizeRole((session.user as any).role) ?? "reader"
  const allowedTargets = ROLE_PERMISSIONS[actorRole] ?? []

  if (!allowedTargets.length) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const username = typeof body.username === "string" ? body.username.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const requestedRoleCandidate = normalizeRole(body.role)
    const requestedRole = (requestedRoleCandidate ?? allowedTargets[0]) as UserRole

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    if (!allowedTargets.includes(requestedRole)) {
      return NextResponse.json({ error: "Role not allowed for creator" }, { status: 403 })
    }

    const existingUser = await findUserByEmailOrUsername(email, username)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = hashPassword(password)
    const user = await createUser({
      username,
      email,
      password: hashedPassword,
      role: requestedRole,
    })

    await recordUserCreationToSheet({
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at as Date | string | null | undefined,
    })

    return NextResponse.json(
      {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role.toLowerCase(),
        created_at: user.created_at,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Privileged user creation failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
