import { NextResponse } from "next/server"
import { incrementNovelViews, findNovelById } from "@/lib/repositories/novels"

export async function POST(_: Request, context: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  const resolved = context.params instanceof Promise ? await context.params : context.params
  const novelId = Number.parseInt(resolved?.id ?? "")

  if (!Number.isFinite(novelId)) {
    return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
  }

  const exists = await findNovelById(novelId)
  if (!exists) {
    return NextResponse.json({ error: "Novel not found" }, { status: 404 })
  }

  await incrementNovelViews(novelId)
  return NextResponse.json({ success: true })
}
