import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { updateUserProfile } from "@/lib/repositories/users"
import { normalizeProfileImageUrl } from "@/lib/utils"

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) ?? {}
    const rawBio =
      typeof body?.bio === "string"
        ? body.bio.trim()
        : typeof body?.Bio === "string"
        ? body.Bio.trim()
        : undefined
    const rawProfilePicture =
      typeof body?.profilePicture === "string"
        ? body.profilePicture.trim()
        : typeof body?.profile_picture === "string"
        ? body.profile_picture.trim()
        : undefined

    if (rawBio === undefined && rawProfilePicture === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    if (typeof rawBio === "string" && rawBio.length > 2000) {
      return NextResponse.json({ error: "Bio is too long" }, { status: 400 })
    }

    const userId = Number.parseInt((session.user as any).id)

    const data: Record<string, string | null | undefined> = {}

    if (rawBio !== undefined) {
      data.bio = rawBio.length === 0 ? null : rawBio
    }

    if (rawProfilePicture !== undefined) {
      if (rawProfilePicture.length === 0) {
        data.profile_picture = null
      } else {
        data.profile_picture = normalizeProfileImageUrl(rawProfilePicture) ?? rawProfilePicture
      }
    }

    const updated = await updateUserProfile(userId, data)

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      bio: updated.bio ?? null,
      profilePicture: updated.profile_picture ?? null,
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
