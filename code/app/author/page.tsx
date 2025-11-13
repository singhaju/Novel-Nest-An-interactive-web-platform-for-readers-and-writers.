import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, FileText, Eye } from "lucide-react"

export default async function AuthorDashboardPage() {
  const session = await auth()

  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
  if (!session || !["writer", "admin", "developer"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)

  const novels = await prisma.novel.findMany({
    where: { author_id: authorId },
    include: {
      _count: { select: { episodes: true } },
    },
    orderBy: { last_update: "desc" },
  })

  const totalEpisodes = novels.reduce((sum, novel) => sum + (novel._count?.episodes ?? 0), 0)
  const totalViews = novels.reduce((sum, novel) => sum + (novel.views ?? 0), 0)

  const recentNovels = novels.slice(0, 6).map((novel) => ({
    id: novel.novel_id,
    title: novel.title,
    status: novel.status.toLowerCase(),
    views: novel.views ?? 0,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Author Dashboard</h1>

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
              {recentNovels.map((novel) => (
                <Link
                  key={novel.id}
                  href={`/author/novels/${novel.id}`}
                  className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <h3 className="mb-2 text-lg font-semibold">{novel.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="capitalize">{novel.status}</span>
                    <span>{novel.views.toLocaleString()} views</span>
                  </div>
                </Link>
              ))}
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
