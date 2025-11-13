import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToGoogleDrive } from "@/lib/google-drive"

function normaliseEpisodePayload(contentType: string | null, raw: NextRequest) {
  if (contentType && contentType.includes("application/json")) {
    return raw.json()
  }

  return raw.formData().then((formData) => {
    const fromForm = Object.fromEntries(formData.entries())
    return {
      novelId: fromForm.novelId || fromForm.novel_id,
      title: fromForm.title,
      content: fromForm.content,
      isPremium: fromForm.isPremium || fromForm.is_premium,
      price: fromForm.price,
    }
  })
}

// GET /api/episodes?novelId=123 - List episodes for a novel
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const novelIdParam = searchParams.get("novelId")

    if (!novelIdParam) {
      return NextResponse.json({ error: "Novel ID is required" }, { status: 400 })
    }

    const novelId = Number.parseInt(novelIdParam)
    if (Number.isNaN(novelId)) {
      return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
    }

    const episodes = await prisma.episode.findMany({
      where: { novel_id: novelId },
      select: {
        episode_id: true,
        title: true,
        release_date: true,
      },
      orderBy: { episode_id: "asc" },
    })

    return NextResponse.json(
      episodes.map((episode) => ({
        id: episode.episode_id,
        episode_id: episode.episode_id,
        title: episode.title,
        release_date: episode.release_date,
      })),
    )
  } catch (error) {
    console.error("Error fetching episodes:", error)
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 })
  }
}

// POST /api/episodes - Create a new episode
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = typeof (session.user as any).role === "string" ? (session.user as any).role.toLowerCase() : "reader"

    const contentType = request.headers.get("content-type")
    const body: any = await normaliseEpisodePayload(contentType, request)

    const novelIdRaw = typeof body.novelId === "string" ? body.novelId : body.novel_id
    const novelId = Number.parseInt(novelIdRaw ?? "")
    const title = body.title as string | undefined
    const content = body.content as string | undefined

    if (!novelId || Number.isNaN(novelId) || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const novel = await prisma.novel.findUnique({
      where: { novel_id: novelId },
      select: { author_id: true },
    })

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)
    if (novel.author_id !== userId && !["admin", "developer"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let contentUrl = content
    try {
      contentUrl = await uploadToGoogleDrive({
        fileName: `episode_${novelId}_${Date.now()}.txt`,
        mimeType: "text/plain",
        fileContent: content,
        folderId: process.env.GOOGLE_DRIVE_EPISODES_FOLDER_ID,
      })
    } catch (driveError) {
      console.warn("Falling back to storing raw episode content:", driveError)
    }

    const episode = await prisma.episode.create({
      data: {
        novel_id: novelId,
        title,
        content: contentUrl,
      },
      select: {
        episode_id: true,
        novel_id: true,
        title: true,
        release_date: true,
      },
    })

    return NextResponse.json(episode, { status: 201 })
  } catch (error) {
    console.error("Error creating episode:", error)
    return NextResponse.json({ error: "Failed to create episode" }, { status: 500 })
  }
}
