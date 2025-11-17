import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { listNovelsForManagement } from "@/lib/repositories/novels"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function AuthorNovelsPage() {
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["author", "writer", "superadmin"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)
  const canManageAll = role === "superadmin"

  const novels = await listNovelsForManagement(canManageAll ? {} : { authorId })

  const hasPendingEpisodes = (novel: (typeof novels)[number]) => Number(novel.pending_episode_count ?? 0) > 0

  const statusStyles: Record<string, { label: string; className: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
    pending_approval: {
      label: "In review",
      className: "border-amber-300 bg-amber-100 px-3 py-1 text-amber-900",
      variant: "outline",
    },
    approved: {
      label: "Approved",
      className: "border-emerald-300 bg-emerald-100 px-3 py-1 text-emerald-900",
      variant: "outline",
    },
    denial: {
      label: "Denial",
      className: "border-rose-300 bg-rose-100 px-3 py-1 text-rose-900",
      variant: "outline",
    },
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Manage Novels</h1>
          <Link href="/author/novels/create">
            <Button className="rounded-full">Create New Novel</Button>
          </Link>
        </div>

        {novels.length > 0 ? (
          <div className="space-y-4">
            {novels.map((novel) => {
              const normalizedStatus = (novel.status ?? "").toLowerCase().replace(/\s+/g, "_")
              const statusKey = statusAliases[normalizedStatus] ?? normalizedStatus
              const statusStyle = statusStyles[statusKey]
              const badgeLabel = statusStyle?.label ?? statusKey.replace(/_/g, " ")
              const badgeVariant = statusStyle?.variant ?? "secondary"
              const badgeClassName = ["capitalize", statusStyle?.className ?? ""].filter(Boolean).join(" ")
              const pendingEpisodes = hasPendingEpisodes(novel)

              return (
                <Link
                  key={novel.novel_id}
                  href={`/author/novels/${novel.novel_id}`}
                  className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">{novel.title}</h3>
                      {canManageAll && novel.author_username && (
                        <p className="text-sm text-muted-foreground">Author: {novel.author_username}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant={badgeVariant} className={badgeClassName}>
                          {badgeLabel}
                        </Badge>
                        {pendingEpisodes && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
                            Episodes pending review
                          </Badge>
                        )}
                        <span>{Number(novel.views ?? 0).toLocaleString()} views</span>
                        <span>{Number(novel.likes ?? 0).toLocaleString()} likes</span>
                        <span>Rating: {Number(novel.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                    <Button variant="outline">Manage</Button>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">You haven't created any novels yet</p>
            <Link href="/author/novels/create">
              <Button>Create Your First Novel</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
