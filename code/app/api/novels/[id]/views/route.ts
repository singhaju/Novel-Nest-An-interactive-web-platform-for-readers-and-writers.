import { type NextRequest, NextResponse } from "next/server"
import { incrementNovelViews } from "@/lib/repositories/novels"

export async function POST(request: NextRequest, context: any) {
  try {
    const rawParams = context?.params instanceof Promise ? await context.params : context?.params
    const novelId = Number.parseInt(rawParams?.id)

    if (Number.isNaN(novelId)) {
      return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
    }

    await incrementNovelViews(novelId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording novel view:", error)
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
  }
}
