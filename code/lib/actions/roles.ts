"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { ensureUserRole } from "@/lib/permissions"
import { updateUserRole } from "@/lib/repositories/users"

export async function upgradeToWriter() {
  const session = await auth()

  if (!session?.user) {
    throw new Error("You must be signed in to switch roles.")
  }

  const userId = Number.parseInt((session.user as any).id, 10)
  if (Number.isNaN(userId)) {
    throw new Error("Invalid session user id")
  }

  const currentRole = ensureUserRole((session.user as any).role)
  if (["writer", "admin", "developer", "superadmin"].includes(currentRole)) {
    return { role: currentRole }
  }

  await updateUserRole(userId, "writer")

  revalidatePath("/author/novels/create")
  revalidatePath("/author")
  revalidatePath("/")

  return { role: "writer" as const }
}
