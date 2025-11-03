import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, BookOpen, AlertCircle } from "lucide-react"

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  // Fetch stats
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: totalNovels } = await supabase.from("novels").select("*", { count: "exact", head: true })

  const { count: pendingReviews } = await supabase
    .from("novels")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Users</h3>
            </div>
            <p className="text-5xl font-bold">{totalUsers?.toLocaleString() || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Novels</h3>
            </div>
            <p className="text-5xl font-bold">{totalNovels?.toLocaleString() || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Pending Reviews</h3>
            </div>
            <p className="text-5xl font-bold">{pendingReviews || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>
        </section>
      </main>
    </div>
  )
}
