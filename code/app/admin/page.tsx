import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, BookOpen, AlertCircle, NotebookPen } from "lucide-react"
import { getEpisodeReviewCounts, getNovelCounts, getUserCount } from "@/lib/repositories/stats"

export default async function AdminDashboardPage() {
  // ✅ 1. Protect admin page using new helper
  const session = await auth()

  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
  if (!session || !["admin", "superadmin"].includes(role)) {
    redirect("/")
  }

  const [userCount, novelCounts, episodeCounts] = await Promise.all([
    getUserCount(),
    getNovelCounts(),
    getEpisodeReviewCounts(),
  ])
  const totalUsers = userCount
  const totalNovels = novelCounts.total
  const pendingNovels = novelCounts.pending
  const pendingEpisodes = episodeCounts.pending

  const hasPending = pendingNovels > 0
  const hasPendingEpisodes = pendingEpisodes > 0

  // ✅ 5. Page UI
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Total Users */}
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Users</h3>
            </div>
            <p className="text-5xl font-bold">{totalUsers.toLocaleString()}</p>
          </div>

          {/* Total Novels */}
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Novels</h3>
            </div>
            <p className="text-5xl font-bold">{totalNovels.toLocaleString()}</p>
          </div>

          {/* Pending Reviews */}
          <Link href="/admin/novels/pending" className="block">
            <div
              className={cn(
                "rounded-3xl border-2 border-border bg-card p-8 transition-colors",
                hasPending && "border-destructive/60 bg-destructive/10",
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <AlertCircle className={cn("h-6 w-6", hasPending ? "text-destructive" : "text-muted-foreground")} />
                <h3 className="text-lg font-medium text-muted-foreground">Pending Reviews</h3>
              </div>
              <p className="text-5xl font-bold">{pendingNovels}</p>
              {hasPending && <p className="mt-2 text-sm text-destructive">Action required</p>}
            </div>
          </Link>

          {/* Pending Episodes */}
          <Link href="/admin/episodes/pending" className="block">
            <div
              className={cn(
                "rounded-3xl border-2 border-border bg-card p-8 transition-colors",
                hasPendingEpisodes && "border-amber-500/60 bg-amber-50",
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <NotebookPen className={cn("h-6 w-6", hasPendingEpisodes ? "text-amber-600" : "text-muted-foreground")} />
                <h3 className="text-lg font-medium text-muted-foreground">Pending Episodes</h3>
              </div>
              <p className="text-5xl font-bold">{pendingEpisodes}</p>
              {hasPendingEpisodes && <p className="mt-2 text-sm text-amber-700">Awaiting review</p>}
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 rounded-3xl text-lg bg-transparent">
                User Management
              </Button>
            </Link>
            <Link href="/admin/novels">
              <Button variant="outline" className="w-full h-20 rounded-3xl text-lg bg-transparent">
                Novel Management
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full h-20 rounded-3xl text-lg bg-transparent">
                Reports
              </Button>
            </Link>
            <Link href="/admin/episodes/pending">
              <Button variant="outline" className="w-full h-20 rounded-3xl text-lg bg-transparent">
                Episode Approvals
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
