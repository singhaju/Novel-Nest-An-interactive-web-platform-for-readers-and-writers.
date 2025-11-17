import { Header } from "@/components/header"
import { EditChapterForm } from "@/components/edit-chapter-form"
import { auth } from "@/lib/auth"
import { findNovelById } from "@/lib/repositories/novels"
import { findEpisodeWithNovel, listEpisodesByNovel } from "@/lib/repositories/episodes"
import { getFileFromGoogleDrive } from "@/lib/google-drive"
import { redirect, notFound } from "next/navigation"

async function resolveEpisodeContent(rawContent: string | null) {
  if (!rawContent) {
    return ""
  }

  if (rawContent.includes("drive.google.com")) {
    try {
      return await getFileFromGoogleDrive(rawContent)
    } catch (error) {
      console.error("Failed to fetch Google Drive content:", error)
      return ""
    }
  }

  return rawContent
}

type PageParams = { id: string; chapterId: string }

export default async function EditEpisodePage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["author", "writer", "superadmin"].includes(role)) {
    redirect("/")
  }

  const userId = Number.parseInt((session.user as any).id)
  const novelId = Number.parseInt(resolvedParams.id)
  const episodeId = Number.parseInt(resolvedParams.chapterId)

  if (Number.isNaN(novelId) || Number.isNaN(episodeId)) {
    notFound()
  }

  const canManageAll = role === "superadmin"

  const novel = await findNovelById(novelId)

  if (!novel || (!canManageAll && novel.author_id !== userId)) {
    notFound()
  }

  const episode = await findEpisodeWithNovel(episodeId)

  if (!episode || episode.novel_id !== novelId) {
    notFound()
  }

  const orderedEpisodes = await listEpisodesByNovel(novelId)

  const chapterNumber = orderedEpisodes.findIndex((item) => item.episode_id === episodeId) + 1
  const contentText = await resolveEpisodeContent(episode.content)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Edit Episode</h1>
        <p className="mb-8 text-muted-foreground">{novel.title}</p>

        <EditChapterForm
          novelId={novelId}
          episodeId={episodeId}
          chapterNumber={chapterNumber > 0 ? chapterNumber : 1}
          defaultTitle={episode.title}
          defaultContent={contentText}
        />
      </main>
    </div>
  )
}
