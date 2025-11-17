import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminManagementPage() {
  const user = await getCurrentUser()

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Management</h1>

        {/* Top Actions */}
        <div className="space-y-4 mb-8">
          <Button className="w-full h-20 rounded-3xl text-lg">Announcement</Button>
          <Button className="w-full h-20 rounded-3xl text-lg">Ads Management</Button>
        </div>

        {/* Management Sections */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* User Management */}
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="space-y-3">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  View All Users
                </Button>
              </Link>
              <Link href="/admin/users/authors">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  Manage Authors
                </Button>
              </Link>
              <Link href="/admin/users/suspended">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  Suspended Users
                </Button>
              </Link>
            </div>
          </div>

          {/* Novels */}
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Novels</h2>
            <div className="space-y-3">
              <Link href="/admin/novels">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  All Novels
                </Button>
              </Link>
              <Link href="/admin/novels/pending">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  Pending Approvals
                </Button>
              </Link>
            </div>
          </div>

          {/* Reports */}
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <div className="space-y-3">
              <Link href="/admin/reports/users">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  User Reports
                </Button>
              </Link>
              <Link href="/admin/reports/authors">
                <Button variant="outline" className="w-full rounded-3xl bg-transparent">
                  Author Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
