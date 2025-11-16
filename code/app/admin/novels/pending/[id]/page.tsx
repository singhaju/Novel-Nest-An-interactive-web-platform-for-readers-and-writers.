import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Header } from "@/components/header"
import { ApproveNovelButton } from "@/components/approve-novel-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFileFromGoogleDrive } from "@/lib/google-drive"
import { normalizeCoverImageUrl } from "@/lib/utils"

async function resolveEpisodeContent(raw: string | null): Promise<string> {
  if (!raw) return ""

  if (raw.includes("drive.google.com")) {
    try {
      return await getFileFromGoogleDrive(raw)
    } catch (error) {
      console.error("Failed to fetch episode content from Drive", error)
      return ""
    }
  }

  return raw
}

interface PageParams {
  id: string
}

export default async function PendingNovelReviewPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["admin", "superadmin"].includes(role)) {
    redirect("/")
  }

  const novelId = Number.parseInt(resolvedParams.id, 10)
  if (Number.isNaN(novelId)) {
    notFound()
  }

  const novel = await prisma.novel.findUnique({
    where: { novel_id: novelId },
    include: {
      author: {
        select: {
          username: true,
          bio: true,
        },
      },
      episodes: {
        orderBy: { episode_id: "asc" },
        select: {
          episode_id: true,
          title: true,
          content: true,
          release_date: true,
        },
      },
    },
  })

  if (!novel || novel.status !== "PENDING_APPROVAL") {
    notFound()
  }

  const episodesWithContent = await Promise.all(
    novel.episodes.map(async (episode) => ({
      ...episode,
      resolvedContent: await resolveEpisodeContent(episode.content),
    })),
  )

  const coverSrc = normalizeCoverImageUrl(novel.cover_image) ?? undefined

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Review Submission</h1>
            <p className="text-sm text-muted-foreground">Assess the novel before publishing.</p>
          </div>
          <Link href="/admin/novels/pending" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to queue
          </Link>
        </div>

        <Card className="mb-8 rounded-3xl border-border">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              <CardTitle className="text-2xl font-semibold">{novel.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {novel.author?.username ?? "Unknown"} • {new Date(novel.created_at).toLocaleString()}
              </p>
              {novel.tags && <p className="text-sm text-muted-foreground">Tags: {novel.tags}</p>}
              {novel.description && <p className="text-sm leading-relaxed text-muted-foreground">{novel.description}</p>}
              {novel.author?.bio && (
                <p className="text-sm text-muted-foreground">Author bio: {novel.author.bio}</p>
              )}
            </div>
            {coverSrc && (
              <img
                src={coverSrc}
                alt={`${novel.title} cover`}
                className="h-48 w-36 rounded-xl object-cover shadow-sm"
              />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <ApproveNovelButton novelId={String(novel.novel_id)} redirectTo="/admin/novels/pending" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Submitted Episodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {episodesWithContent.length === 0 && (
              <p className="text-sm text-muted-foreground">No episodes submitted yet.</p>
            )}
            {episodesWithContent.map((episode, index) => (
              <div key={episode.episode_id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Episode {index + 1}: {episode.title}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {episode.release_date ? new Date(episode.release_date).toLocaleDateString() : "Unreleased"}
                  </span>
                </div>
                <Separator className="my-3" />
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap wrap-break-word text-sm text-muted-foreground">
                  {episode.resolvedContent || "No content provided."}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
