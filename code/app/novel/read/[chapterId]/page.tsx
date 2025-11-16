import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFileFromGoogleDrive } from "@/lib/google-drive"
import { notFound } from "next/navigation"
import Link from "next/link"

async function loadContent(source: string | null) {
  if (!source) {
    return ""
  }

  if (source.includes("drive.google.com")) {
    try {
      return await getFileFromGoogleDrive(source)
    } catch (error) {
      console.error("Failed to read episode from Drive:", error)
      return ""
    }
  }

  return source
}

type PageParams = { chapterId: string }

export default async function ReadChapterPage(props: { params: PageParams } | { params: Promise<PageParams> }) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const episodeId = Number.parseInt(resolvedParams.chapterId)

  if (Number.isNaN(episodeId)) {
    notFound()
  }

  const episode = await prisma.episode.findUnique({
    where: { episode_id: episodeId },
    include: {
      novel: {
        select: {
          novel_id: true,
          title: true,
          author: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  })

  if (!episode) {
    notFound()
  }

  const orderedEpisodes = await prisma.episode.findMany({
    where: { novel_id: episode.novel_id },
    orderBy: { episode_id: "asc" },
    select: { episode_id: true },
  })

  const currentIndex = orderedEpisodes.findIndex((item) => item.episode_id === episodeId)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const previousEpisode = orderedEpisodes[safeIndex - 1]
  const nextEpisode = orderedEpisodes[safeIndex + 1]

  const session = await auth()
  const userId = session?.user ? Number.parseInt((session.user as any).id) : null

  if (userId && Number.isFinite(userId)) {
    await prisma.userReadingProgress.upsert({
      where: {
        user_id_novel_id: {
          user_id: userId,
          novel_id: episode.novel_id,
        },
      },
      update: {
        last_read_episode_id: episode.episode_id,
      },
      create: {
        user_id: userId,
        novel_id: episode.novel_id,
        last_read_episode_id: episode.episode_id,
      },
    })
  }

  const content = await loadContent(episode.content)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Story: {episode.novel.title}</p>
          <h1 className="mb-2 text-4xl font-bold text-foreground">Episode {safeIndex + 1}</h1>
          <p className="text-xl text-muted-foreground">Author {episode.novel.author?.username ?? "Unknown"}</p>
        </div>

        <div className="mb-8 rounded-3xl border border-border bg-card p-8">
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{content}</p>
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          {previousEpisode ? (
            <Link href={`/novel/read/${previousEpisode.episode_id}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-3xl bg-transparent py-6">
                Previous Episode
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="flex-1 rounded-3xl bg-transparent py-6">
              Previous Episode
            </Button>
          )}

          {nextEpisode ? (
            <Link href={`/novel/read/${nextEpisode.episode_id}`} className="flex-1">
              <Button className="w-full rounded-3xl py-6">Next Episode</Button>
            </Link>
          ) : (
            <Button disabled className="flex-1 rounded-3xl py-6">
              Next Episode
            </Button>
          )}
        </div>

        <CommentSection episodeId={episodeId} />
      </main>
    </div>
  )
}
