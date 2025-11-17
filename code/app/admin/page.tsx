import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PrivilegedInviteForm } from "@/components/privileged-invite-form"
import { SuperadminUserManagementTable } from "@/components/superadmin-user-management-table"
import { auth } from "@/lib/auth"
import { getEpisodeReviewCounts, getNovelCounts, getUserCount } from "@/lib/repositories/stats"
import { listUsers } from "@/lib/repositories/users"
import { cn } from "@/lib/utils"
import { Users, BookOpen, AlertCircle, NotebookPen } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminDashboardPage() {
  const session = await auth()

  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
  if (!session || !["admin", "superadmin"].includes(role)) {
    redirect("/")
  }

  const [userCount, novelCounts, episodeCounts, managedUsers] = await Promise.all([
    getUserCount(),
    getNovelCounts(),
    getEpisodeReviewCounts(),
    role === "superadmin" ? listUsers(500) : Promise.resolve([]),
  ])

  const totalUsers = userCount
  const totalNovels = novelCounts.total
  const pendingNovels = novelCounts.pending
  const pendingEpisodes = episodeCounts.pending

  const hasPending = pendingNovels > 0
  const hasPendingEpisodes = pendingEpisodes > 0
  const userManagementHref = role === "superadmin" ? "/admin#user-management" : "/admin/users"

  const managedUsersForClient = role === "superadmin"
    ? managedUsers.map((profile) => ({
        id: profile.user_id,
        username: profile.username ?? null,
        role: profile.role.toLowerCase(),
        joinedAt: profile.created_at.toISOString(),
      }))
    : []

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
            <Link href={userManagementHref}>
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

        {role === "superadmin" && (
          <section id="user-management" className="mt-12 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">User Management</h2>
              <p className="text-sm text-muted-foreground">
                Provision new accounts and review platform roles without leaving the dashboard.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-6">
              <PrivilegedInviteForm
                allowedRoles={["reader", "writer", "admin", "developer", "superadmin"]}
                title="Create a new account"
                description="Super Admins can provision any role, including fellow Super Admins."
              />
            </div>

            <div className="rounded-3xl border-2 border-border bg-card p-6">
              <SuperadminUserManagementTable users={managedUsersForClient} />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
