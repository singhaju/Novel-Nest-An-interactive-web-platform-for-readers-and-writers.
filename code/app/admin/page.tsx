import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth" // ✅ use the new `auth()` helper
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, BookOpen, AlertCircle } from "lucide-react"

export default async function AdminDashboardPage() {
  // ✅ 1. Protect admin page using new helper
  const session = await auth()

  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"
  if (!session || role !== "admin") {
    redirect("/")
  }

  // ✅ 2. Set base URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  // ✅ 3. Fetch user stats
  const usersRes = await fetch(`${baseUrl}/api/users/stats`, { cache: "no-store" })
  const usersData = usersRes.ok ? await usersRes.json() : { total: 0 }

  // ✅ 4. Fetch novel stats
  const novelsRes = await fetch(`${baseUrl}/api/novels/stats`, { cache: "no-store" })
  const novelsData = novelsRes.ok ? await novelsRes.json() : { total: 0, pending: 0 }

  // ✅ 5. Page UI
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {/* Total Users */}
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Users</h3>
            </div>
            <p className="text-5xl font-bold">{usersData.total?.toLocaleString() || 0}</p>
          </div>

          {/* Total Novels */}
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Total Novels</h3>
            </div>
            <p className="text-5xl font-bold">{novelsData.total?.toLocaleString() || 0}</p>
          </div>

          {/* Pending Reviews */}
          <div className="rounded-3xl border-2 border-border bg-card p-8">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <h3 className="text-lg font-medium text-muted-foreground">Pending Reviews</h3>
            </div>
            <p className="text-5xl font-bold">{novelsData.pending || 0}</p>
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
