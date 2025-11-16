import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmailOrUsername } from "@/lib/repositories/users"
import { hashPassword } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role = "READER" } = body
    const allowedRoles = ["READER", "WRITER"] as const
    const normalizedRole = typeof role === "string" ? role.toUpperCase() : "READER"
    const assignedRole = allowedRoles.includes(normalizedRole as (typeof allowedRoles)[number])
      ? (normalizedRole as (typeof allowedRoles)[number])
      : "READER"

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
  const existingUser = await findUserByEmailOrUsername(email, username)

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = hashPassword(password)

    const user = await createUser({
      username,
      email,
      password: hashedPassword,
      role: assignedRole.toLowerCase() as any,
    })

    const responsePayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    }

    return NextResponse.json(responsePayload, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
