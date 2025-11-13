import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = typeof (session.user as any)?.role === "string" ? (session.user as any).role.toLowerCase() : "reader"

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const total = await prisma.novel.count()
    const pending = await prisma.novel.count({
      where: { status: "PENDING_APPROVAL" },
    })

    return NextResponse.json({ total, pending })
  } catch (error) {
    console.error("[v0] Error fetching novel stats:", error)
    return NextResponse.json({ error: "Failed to fetch novel stats" }, { status: 500 })
  }
}
