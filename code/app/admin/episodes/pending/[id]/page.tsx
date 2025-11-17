import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EpisodeReviewActions } from "@/components/episode-review-actions"
import { auth } from "@/lib/auth"
import { getFileFromGoogleDrive } from "@/lib/google-drive"
import { findEpisodeWithDetails } from "@/lib/repositories/episodes"

async function resolveEpisodeContent(raw: string | null): Promise<string> {
  if (!raw) return ""

  if (raw.includes("drive.google.com")) {
    try {
      return await getFileFromGoogleDrive(raw)
    } catch (error) {
      console.error("Failed to load episode content", error)
      return ""
    }
  }

  return raw
}

interface PageParams {
  id: string
}

export default async function PendingEpisodeDetailPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["admin", "superadmin"].includes(role)) {
    redirect("/")
  }

  const episodeId = Number.parseInt(resolvedParams.id, 10)
  if (Number.isNaN(episodeId)) {
    notFound()
  }

  const episode = await findEpisodeWithDetails(episodeId)

  if (!episode || episode.status !== "PENDING_APPROVAL") {
    notFound()
  }

  const content = await resolveEpisodeContent(episode.content)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Episode Review</h1>
            <p className="text-sm text-muted-foreground">Approve or deny the submitted chapter.</p>
          </div>
          <Link href="/admin/episodes/pending" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to queue
          </Link>
        </div>

        <Card className="mb-8 rounded-3xl border-border">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">{episode.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Novel: <span className="font-medium">{episode.novel_title}</span>
                {episode.author_username ? ` • ${episode.author_username}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(episode.release_date).toLocaleString()}
              </p>
              <Badge variant="outline" className="w-fit">In review</Badge>
            </div>
            <EpisodeReviewActions episodeId={episode.episode_id} redirectTo="/admin/episodes/pending" />
          </CardHeader>
          <CardContent>
            <Separator className="my-4" />
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap text-sm text-muted-foreground">
              {content || "No content provided."}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
