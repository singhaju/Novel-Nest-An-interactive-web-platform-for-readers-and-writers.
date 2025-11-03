import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Database, HardDrive, Activity, Users } from "lucide-react"

export default async function DeveloperDashboardPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "developer") {
    redirect("/")
  }

  const supabase = await createClient()

  // Fetch database stats
  const { count: totalRecords } = await supabase.from("novels").select("*", { count: "exact", head: true })

  const { count: totalTransactions } = await supabase
    .from("purchased_episodes")
    .select("*", { count: "exact", head: true })

  const { count: userContent } = await supabase.from("comments").select("*", { count: "exact", head: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Developer Dashboard</h1>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Database Size</h3>
            </div>
            <p className="text-3xl font-bold">0.7TB</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Records</h3>
            </div>
            <p className="text-3xl font-bold">{totalRecords || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Transactions</h3>
            </div>
            <p className="text-3xl font-bold">{totalTransactions?.toLocaleString() || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">User Content</h3>
            </div>
            <p className="text-3xl font-bold">{userContent?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Server Metrics */}
        <div className="rounded-3xl border-2 border-border bg-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Server Metrics</h2>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm font-bold">53.1%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: "53.1%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm font-bold">75.6%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: "75.6%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm font-bold">19.7%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: "19.7%" }} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Active Connections</p>
              <p className="text-2xl font-bold">570</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Request/Minute</p>
              <p className="text-2xl font-bold">1,277</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Uptime</p>
              <p className="text-2xl font-bold">15 days, 23 hours</p>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 underline">System Monitoring</h3>
            <div className="space-y-3">
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                System Logs
              </button>
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Audit Logs
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 underline">Database</h3>
            <div className="space-y-3">
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Database Explorer
              </button>
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Backup & Restore
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 underline">Security</h3>
            <div className="space-y-3">
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Security Settings
              </button>
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Audit Trails
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 underline">Features</h3>
            <div className="space-y-3">
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Feature Flags
              </button>
              <button className="w-full rounded-3xl border border-border bg-background px-6 py-3 text-sm hover:bg-accent transition-colors">
                Configuration
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
