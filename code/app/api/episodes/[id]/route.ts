import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getFileFromGoogleDrive, uploadToGoogleDrive } from "@/lib/google-drive"

function extractEpisodeId(context: any) {
  const rawParams = context?.params instanceof Promise ? context.params : context?.params
  return rawParams
}

async function safeGetEpisodeContent(content: string | null) {
  if (!content) {
    return ""
  }

  if (content.includes("drive.google.com")) {
    try {
      return await getFileFromGoogleDrive(content)
    } catch (driveError) {
      console.error("Failed to load episode content from Drive:", driveError)
      return ""
    }
  }

  return content
}

// GET /api/episodes/[id] - Get episode with content
export async function GET(request: NextRequest, context: any) {
  const params = await extractEpisodeId(context)
  try {
    const episodeId = Number.parseInt(params?.id)

    if (Number.isNaN(episodeId)) {
      return NextResponse.json({ error: "Invalid episode id" }, { status: 400 })
    }

    const episode = await prisma.episode.findUnique({
      where: { episode_id: episodeId },
      include: {
        novel: {
          select: {
            novel_id: true,
            title: true,
            author_id: true,
          },
        },
      },
    })

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const content = await safeGetEpisodeContent(episode.content)

    return NextResponse.json({
      ...episode,
      contentText: content,
    })
  } catch (error) {
    console.error("Error fetching episode:", error)
    return NextResponse.json({ error: "Failed to fetch episode" }, { status: 500 })
  }
}

// PATCH /api/episodes/[id] - Update title/content
export async function PATCH(request: NextRequest, context: any) {
  const params = await extractEpisodeId(context)
  const episodeId = Number.parseInt(params?.id)

  if (Number.isNaN(episodeId)) {
    return NextResponse.json({ error: "Invalid episode id" }, { status: 400 })
  }

  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content } = body

    const episode = await prisma.episode.findUnique({
      where: { episode_id: episodeId },
      select: {
        novel_id: true,
        content: true,
        novel: {
          select: { author_id: true },
        },
      },
    })

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)
    if (episode.novel.author_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Record<string, string> = {}

    if (title) {
      updateData.title = title
    }

    if (typeof content === "string") {
      updateData.content = content
      try {
        const newContentUrl = await uploadToGoogleDrive({
          fileName: `episode_${episode.novel_id}_${episodeId}_${Date.now()}.txt`,
          mimeType: "text/plain",
          fileContent: content,
          folderId: process.env.GOOGLE_DRIVE_EPISODES_FOLDER_ID,
        })
        updateData.content = newContentUrl
      } catch (driveError) {
        console.warn("Falling back to inline content for episode update:", driveError)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const updatedEpisode = await prisma.episode.update({
      where: { episode_id: episodeId },
      data: updateData,
      select: {
        episode_id: true,
        novel_id: true,
        title: true,
        release_date: true,
      },
    })

    return NextResponse.json(updatedEpisode)
  } catch (error) {
    console.error("Error updating episode:", error)
    return NextResponse.json({ error: "Failed to update episode" }, { status: 500 })
  }
}

// DELETE /api/episodes/[id] - Remove an episode
export async function DELETE(request: NextRequest, context: any) {
  const params = await extractEpisodeId(context)
  const episodeId = Number.parseInt(params?.id)

  if (Number.isNaN(episodeId)) {
    return NextResponse.json({ error: "Invalid episode id" }, { status: 400 })
  }

  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const episode = await prisma.episode.findUnique({
      where: { episode_id: episodeId },
      select: {
        content: true,
        novel: {
          select: { author_id: true },
        },
      },
    })

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 })
    }

    const userId = Number.parseInt((session.user as any).id)
    if (episode.novel.author_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.comment.deleteMany({ where: { episode_id: episodeId } })
    await prisma.episode.delete({ where: { episode_id: episodeId } })

    return NextResponse.json({ message: "Episode deleted" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting episode:", error)
    return NextResponse.json({ error: "Failed to delete episode" }, { status: 500 })
  }
}
