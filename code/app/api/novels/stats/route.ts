import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getNovelCounts } from "@/lib/repositories/stats"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = typeof (session.user as any)?.role === "string" ? (session.user as any).role.toLowerCase() : "reader"

  if (!["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { total, pending } = await getNovelCounts()

    return NextResponse.json({ total, pending })
  } catch (error) {
    console.error("[v0] Error fetching novel stats:", error)
    return NextResponse.json({ error: "Failed to fetch novel stats" }, { status: 500 })
  }
}
