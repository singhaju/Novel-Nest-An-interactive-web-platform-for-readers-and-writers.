import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { findUserById, setUserBanStatus } from "@/lib/repositories/users"

const ADMIN_ROLES = new Set(["admin", "superadmin"])
const MANAGEABLE_ROLES = new Set(["reader", "writer"])

type RouteParams = { userId: string }

async function mutateBanStatus(paramsOrPromise: RouteParams | Promise<RouteParams>, shouldBan: boolean) {
  const params = paramsOrPromise instanceof Promise ? await paramsOrPromise : paramsOrPromise
  const session = await auth()
  const actorRole = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session?.user || !ADMIN_ROLES.has(actorRole)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const targetId = Number.parseInt(params.userId, 10)
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 })
  }

  const target = await findUserById(targetId)
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const targetRole = typeof target.role === "string" ? target.role.toLowerCase() : "reader"
  if (!MANAGEABLE_ROLES.has(targetRole)) {
    return NextResponse.json({ error: "Only reader and writer accounts can be managed" }, { status: 400 })
  }

  if (Boolean(target.is_banned) === shouldBan) {
    return NextResponse.json({
      success: true,
      user: {
        id: target.user_id,
        username: target.username,
        role: targetRole,
        isBanned: Boolean(target.is_banned),
      },
    })
  }

  const updated = await setUserBanStatus(targetId, shouldBan)
  return NextResponse.json({
    success: true,
    user: updated
      ? {
          id: updated.user_id,
          username: updated.username,
          role: typeof updated.role === "string" ? updated.role.toLowerCase() : targetRole,
          isBanned: Boolean(updated.is_banned),
        }
      : null,
  })
}

export async function POST(_request: Request, context: { params: RouteParams } | { params: Promise<RouteParams> }) {
  return mutateBanStatus(context.params, true)
}

export async function DELETE(_request: Request, context: { params: RouteParams } | { params: Promise<RouteParams> }) {
  return mutateBanStatus(context.params, false)
}
