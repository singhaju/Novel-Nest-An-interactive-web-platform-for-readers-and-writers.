import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NovelGenreEditor } from "@/components/novel-genre-editor"
import { NovelCoverEditor } from "@/components/novel-cover-editor"
import { auth } from "@/lib/auth"
import { getNovelDetail } from "@/lib/repositories/novels"
import { parseGenresFromString } from "@/lib/genres"
import { normalizeCoverImageUrl } from "@/lib/utils"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Plus, CheckCircle2, Clock3, XCircle, HelpCircle } from "lucide-react"

type PageParams = { id: string }

export default async function ManageNovelPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["author", "writer", "superadmin"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)
  const novelId = Number.parseInt(resolvedParams.id)

  if (Number.isNaN(novelId)) {
    notFound()
  }

  const canManageAll = role === "superadmin"

  const detail = await getNovelDetail(novelId)
  if (!detail) {
    notFound()
  }

  if (!canManageAll && detail.novel.author_id !== authorId) {
    notFound()
  }

  const novel = detail.novel
  const episodes = detail.episodes
  const normalizedNovelStatus = (novel.status ?? "").toLowerCase().replace(/\s+/g, "_")
  const defaultEpisodeStatus =
    normalizedNovelStatus === "pending_approval"
      ? "pending_approval"
      : normalizedNovelStatus === "denial"
        ? "denial"
        : "approved"
  const novelStatusLabel = novel.status
    ? novel.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown"
  const isNovelPending = (novel.status ?? "").toUpperCase() === "PENDING_APPROVAL"

  const statusAliases: Record<string, string> = {
    pending: "pending_approval",
    pending_approval: "pending_approval",
    in_review: "pending_approval",
    review: "pending_approval",
    reviewing: "pending_approval",
    approved: "approved",
    approval: "approved",
    on_going: "approved",
    ongoing: "approved",
    completed: "approved",
    hiatus: "approved",
    published: "approved",
    denial: "denial",
    denied: "denial",
    rejected: "denial",
  }

  const episodeStatusMeta: Record<
    string,
    {
      icon: LucideIcon
      className: string
      label: string
      iconClassName?: string
    }
  > = {
    approved: {
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Approved",
    },
    pending_approval: {
      icon: Clock3,
      className: "border-amber-400 bg-amber-100 text-amber-900",
      label: "In review",
      iconClassName: "text-amber-900",
    },
    denial: {
      icon: XCircle,
      className: "border-rose-200 bg-rose-50 text-rose-700",
      label: "Denied",
    },
    default: {
      icon: HelpCircle,
      className: "border-border/60 bg-muted text-muted-foreground",
      label: "Status unknown",
    },
  }
  const initialGenres = parseGenresFromString(novel.tags)
  const coverUrl = normalizeCoverImageUrl(novel.cover_image ?? undefined) ?? null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">{novel.title}</h1>
          <div className="flex items-center gap-3 text-muted-foreground">
            <p>
              Status: <span className="font-medium text-foreground">{novelStatusLabel}</span>
            </p>
            {isNovelPending && (
              <Badge variant="outline" className="border-amber-300 text-amber-900">
                Awaiting approval
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Episodes</p>
            <p className="text-2xl font-bold">{episodes.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Views</p>
            <p className="text-2xl font-bold">{(novel.views ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Likes</p>
            <p className="text-2xl font-bold">{(novel.likes ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Rating</p>
            <p className="text-2xl font-bold">{Number(novel.rating ?? 0).toFixed(1)}</p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Cover Image</h2>
              <p className="text-sm text-muted-foreground">Upload, replace, or remove the novel&apos;s cover.</p>
            </div>
          </div>
          <NovelCoverEditor novelId={novel.novel_id} initialCoverUrl={coverUrl} title={novel.title} />
        </div>

        <div className="mb-8 rounded-3xl border border-border bg-card p-6">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Genres</h2>
              <p className="text-sm text-muted-foreground">Update the categories that best describe this story.</p>
            </div>
          </div>
          <NovelGenreEditor novelId={novel.novel_id} initialGenres={initialGenres} />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Episodes</h2>
          <Link href={`/author/novels/${resolvedParams.id}/chapters/create`}>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Episode
            </Button>
          </Link>
        </div>

        {episodes.length > 0 ? (
          <div className="space-y-3">
            {episodes.map((episode, index) => {
              const rawEpisodeStatus = typeof (episode as any).status === "string" ? (episode as any).status : null
              const normalizedEpisodeStatus = (rawEpisodeStatus ?? "").toLowerCase().replace(/\s+/g, "_")
              const statusKey = statusAliases[normalizedEpisodeStatus] ?? (normalizedEpisodeStatus || defaultEpisodeStatus)
              const statusMeta = episodeStatusMeta[statusKey] ?? episodeStatusMeta.default
              const StatusIcon = statusMeta.icon

              return (
                <Link
                  key={episode.episode_id}
                  href={`/author/novels/${resolvedParams.id}/chapters/${episode.episode_id}`}
                  className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        Episode {index + 1}: {episode.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {episode.release_date ? new Date(episode.release_date).toLocaleDateString() : "Unscheduled"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm ${statusMeta.className}`}
                        aria-label={statusMeta.label}
                        title={statusMeta.label}
                      >
                        <StatusIcon
                          className={["h-4 w-4", statusMeta.iconClassName ?? ""].filter(Boolean).join(" ")}
                          aria-hidden="true"
                        />
                      </span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">No episodes yet</p>
            <Link href={`/author/novels/${resolvedParams.id}/chapters/create`}>
              <Button>Add First Episode</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
