import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { auth } from "@/lib/auth"
import { getFileFromGoogleDrive } from "@/lib/google-drive"
import { findEpisodeWithDetails, listEpisodeIdsForNovel } from "@/lib/repositories/episodes"
import { upsertReadingProgress } from "@/lib/repositories/reading-progress"
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

  const episode = await findEpisodeWithDetails(episodeId)

  if (!episode) {
    notFound()
  }

  const session = await auth()
  const userId = session?.user ? Number.parseInt((session.user as any).id) : null
  const roleRaw = session?.user ? (session.user as any).role : undefined
  const role = typeof roleRaw === "string" ? roleRaw.toLowerCase() : "reader"
  const privilegedRoles = ["admin", "developer", "superadmin"]
  const isPrivileged = privilegedRoles.includes(role)
  const isAuthor = typeof userId === "number" && Number.isFinite(userId) && episode.author_id === userId
  const restrictToApproved = !(isAuthor || isPrivileged)

  if (episode.status !== "APPROVED" && restrictToApproved) {
    notFound()
  }

  const orderedEpisodeIds = await listEpisodeIdsForNovel(
    episode.novel_id,
    restrictToApproved ? { status: "APPROVED" } : {},
  )

  const currentIndex = orderedEpisodeIds.findIndex((id) => id === episodeId)
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const previousEpisodeId = orderedEpisodeIds[safeIndex - 1]
  const nextEpisodeId = orderedEpisodeIds[safeIndex + 1]

  if (userId && Number.isFinite(userId)) {
    await upsertReadingProgress(userId, episode.novel_id, episode.episode_id)
  }

  const content = await loadContent(episode.content)
  const storyTitle = episode.novel_title ?? "Unknown"
  const authorName = episode.author_username ?? "Unknown"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Story: {storyTitle}</p>
          <h1 className="mb-2 text-4xl font-bold text-foreground">Episode {safeIndex + 1}</h1>
          <p className="text-xl text-muted-foreground">Author {authorName}</p>
        </div>

        <div className="mb-8 rounded-3xl border border-border bg-card p-8">
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{content}</p>
          </div>
        </div>

        <div className="mb-8 flex gap-4">
          {previousEpisodeId ? (
            <Link href={`/novel/read/${previousEpisodeId}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-3xl bg-transparent py-6">
                Previous Episode
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="flex-1 rounded-3xl bg-transparent py-6">
              Previous Episode
            </Button>
          )}

          {nextEpisodeId ? (
            <Link href={`/novel/read/${nextEpisodeId}`} className="flex-1">
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
