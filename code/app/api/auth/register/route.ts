import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmailOrUsername } from "@/lib/repositories/users"
import { hashPassword } from "@/lib/security"
import { recordUserCreationToSheet } from "@/lib/google-sheets"
import { PASSWORD_REQUIREMENTS, evaluatePassword, isPasswordStrong } from "@/lib/password-policy"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role = "READER" } = body
    const normalizedUsername = typeof username === "string" ? username.trim() : ""
    const normalizedEmail = typeof email === "string" ? email.trim() : ""
    const normalizedPassword = typeof password === "string" ? password : ""
    const allowedRoles = ["READER", "WRITER"] as const
    const normalizedRole = typeof role === "string" ? role.toUpperCase() : "READER"
    const assignedRole = allowedRoles.includes(normalizedRole as (typeof allowedRoles)[number])
      ? (normalizedRole as (typeof allowedRoles)[number])
      : "READER"

    // Validate input
    if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isPasswordStrong(normalizedPassword)) {
      const checks = evaluatePassword(normalizedPassword)
      const unmet = PASSWORD_REQUIREMENTS.filter((requirement) => !checks[requirement.key]).map(
        (requirement) => requirement.label.toLowerCase(),
      )
      const message = `Password must include: ${unmet.join(", ")}`
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await findUserByEmailOrUsername(normalizedEmail, normalizedUsername)

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = hashPassword(normalizedPassword)

    const user = await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole.toLowerCase() as any,
    })

    await recordUserCreationToSheet({
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.created_at as Date | string | null | undefined,
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
