import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { installAdvancedSqlFeatures } from "@/lib/db/install-advanced-sql"

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = typeof (session.user as any).role === "string" ? (session.user as any).role.toLowerCase() : "reader"

    if (!["superadmin", "developer"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

  await installAdvancedSqlFeatures()

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Error installing advanced SQL features:", error)
    return NextResponse.json({ error: "Failed to install advanced SQL features" }, { status: 500 })
  }
}
