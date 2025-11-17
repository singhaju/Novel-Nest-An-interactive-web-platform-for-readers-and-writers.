import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { listNovelsForManagement } from "@/lib/repositories/novels"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, FileText, Eye, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default async function AuthorDashboardPage() {
  const session = await auth()

  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
  if (!session || !["writer", "developer", "superadmin"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)

  const novels = await listNovelsForManagement({ authorId })

  const totalEpisodes = novels.reduce((sum, novel) => sum + Number(novel.episode_count ?? 0), 0)
  const totalViews = novels.reduce((sum, novel) => sum + Number(novel.views ?? 0), 0)
  const pendingNovels = novels.filter((novel) => (novel.status ?? "").toUpperCase() === "PENDING_APPROVAL")

  const recentNovels = novels.slice(0, 6).map((novel) => ({
    id: novel.novel_id,
    title: novel.title,
    status: (novel.status ?? "").toLowerCase().replace(/\s+/g, "_"),
    views: Number(novel.views ?? 0),
  }))

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
    denial: "denial",
    denied: "denial",
    rejected: "denial",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Author Dashboard</h1>

        {pendingNovels.length > 0 && (
          <Alert className="mb-6 border-amber-300 bg-amber-100 dark:border-amber-400 dark:bg-amber-500/15 dark:text-amber-900">
            <Clock className="text-black dark:text-amber-200" />
            <AlertTitle>Novels under review</AlertTitle>
            <AlertDescription>
              {pendingNovels.length === 1 ? (
                <p>
                  <strong>{pendingNovels[0].title}</strong> is pending admin approval. We&apos;ll notify you as soon as it&apos;s
                  published.
                </p>
              ) : (
                <p>
                  {pendingNovels.length} of your novels are currently being reviewed. You can keep an eye on their
                  status in the Manage Novels page.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Novels</h3>
            </div>
            <p className="text-4xl font-bold">{novels.length}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Episodes</h3>
            </div>
            <p className="text-4xl font-bold">{totalEpisodes}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
            </div>
            <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/author/novels/create">
              <Button className="h-24 w-full rounded-3xl text-lg">Create New Novel</Button>
            </Link>
            <Link href="/author/novels">
              <Button variant="outline" className="h-24 w-full rounded-3xl bg-transparent text-lg">
                Manage Novels
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Your Novels</h2>
            <Link href="/author/novels">
              <Button variant="outline" className="rounded-full bg-transparent">
                View all
              </Button>
            </Link>
          </div>

          {recentNovels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentNovels.map((novel) => {
                const normalizedStatus = novel.status
                const statusKey = statusAliases[normalizedStatus] ?? normalizedStatus
                const statusStyle = statusStyles[statusKey]
                const badgeLabel = statusStyle?.label ?? statusKey.replace(/_/g, " ")
                const badgeVariant = statusStyle?.variant ?? "secondary"
                const badgeClassName = ["capitalize", statusStyle?.className ?? ""].filter(Boolean).join(" ")

                return (
                  <Link
                    key={novel.id}
                    href={`/author/novels/${novel.id}`}
                    className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                  >
                    <h3 className="mb-2 text-lg font-semibold">{novel.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant={badgeVariant} className={badgeClassName}>
                        {badgeLabel}
                      </Badge>
                      <span>{novel.views.toLocaleString()} views</span>
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
        </section>
      </main>
    </div>
  )
}
