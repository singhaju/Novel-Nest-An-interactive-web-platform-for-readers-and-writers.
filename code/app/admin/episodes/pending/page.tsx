import Link from "next/link"
import { redirect } from "next/navigation"

import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { EpisodeReviewActions } from "@/components/episode-review-actions"
import { auth } from "@/lib/auth"
import { listPendingEpisodes } from "@/lib/repositories/episodes"

export default async function PendingEpisodesPage() {
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["admin", "superadmin"].includes(role)) {
    redirect("/")
  }

  const episodes = await listPendingEpisodes()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pending Episode Approvals</h1>
            <p className="text-sm text-muted-foreground">Review newly submitted or edited episodes before publishing.</p>
          </div>
        </div>

        {episodes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No episodes awaiting review. You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode) => (
              <div key={episode.episode_id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{episode.title}</h2>
                      <Badge variant="outline">In review</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Novel: <span className="font-medium">{episode.novel_title}</span>
                      {episode.author_username ? ` • ${episode.author_username}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(episode.submitted_at).toLocaleString()}
                    </p>
                    <Link
                      href={`/admin/episodes/pending/${episode.episode_id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View details
                    </Link>
                  </div>
                  <EpisodeReviewActions episodeId={episode.episode_id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
