import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { findUserById, updateUserProfile } from "@/lib/repositories/users"

const ADMIN_ROLES = new Set(["admin", "superadmin"])
const MANAGEABLE_ROLES = new Set(["reader", "writer"])

type UpdatePayload = {
  username?: string | null
  bio?: string | null
  profilePicture?: string | null
}

type SanitizedUpdate = {
  username?: string
  bio?: string | null
  profilePicture?: string | null
}

export async function PATCH(request: Request, context: { params: { userId: string } }) {
  const session = await auth()
  const actorRole = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session?.user || !ADMIN_ROLES.has(actorRole)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const targetId = Number.parseInt(context.params.userId, 10)
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
  }

  const target = await findUserById(targetId)
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const targetRole = typeof target.role === "string" ? target.role.toLowerCase() : "reader"
  if (!MANAGEABLE_ROLES.has(targetRole)) {
    return NextResponse.json({ error: "Only reader and writer accounts can be edited" }, { status: 400 })
  }

  let payload: UpdatePayload
  try {
    payload = (await request.json()) as UpdatePayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const nextUsername = typeof payload.username === "string" ? payload.username.trim() : undefined
  const rawBio = typeof payload.bio === "string" ? payload.bio.trim() : typeof payload.bio === "undefined" ? undefined : null
  const nextBio = typeof rawBio === "string" ? (rawBio.length === 0 ? null : rawBio) : rawBio
  const nextProfilePicture = typeof payload.profilePicture === "string"
    ? payload.profilePicture.trim() || null
    : typeof payload.profilePicture === "undefined"
      ? undefined
      : null

  const updateShape: SanitizedUpdate = {}
  if (typeof nextUsername !== "undefined") {
    if (nextUsername.length < 2) {
      return NextResponse.json({ error: "Username must be at least 2 characters" }, { status: 400 })
    }
    updateShape.username = nextUsername
  }
  if (typeof nextBio !== "undefined") {
    updateShape.bio = nextBio
  }
  if (typeof nextProfilePicture !== "undefined") {
    updateShape.profilePicture = nextProfilePicture
  }

  if (Object.keys(updateShape).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 })
  }

  const updated = await updateUserProfile(targetId, {
    username: updateShape.username,
    bio: typeof updateShape.bio === "undefined" ? undefined : updateShape.bio,
    profile_picture: typeof updateShape.profilePicture === "undefined" ? undefined : updateShape.profilePicture,
  })

  if (!updated) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    user: {
      id: updated.user_id,
      username: updated.username,
      bio: updated.bio,
      role: typeof updated.role === "string" ? updated.role.toLowerCase() : targetRole,
      profilePicture: updated.profile_picture,
    },
  })
}
