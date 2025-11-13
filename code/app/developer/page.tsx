import { Header } from "@/components/header"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Database, HardDrive, Activity, Users } from "lucide-react"

export default async function DeveloperDashboardPage() {
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || role !== "developer") {
    redirect("/")
  }

  const [novelCount, episodeCount, commentCount, userCount] = await Promise.all([
    prisma.novel.count(),
    prisma.episode.count(),
    prisma.comment.count(),
    prisma.user.count(),
  ])

  const totalRecords = novelCount + episodeCount + commentCount + userCount

  const recentNovels = await prisma.novel.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      novel_id: true,
      title: true,
      status: true,
      created_at: true,
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Developer Dashboard</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Catalog Size</h3>
            </div>
            <p className="text-3xl font-bold">{novelCount.toLocaleString()} novels</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Records</h3>
            </div>
            <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Published Episodes</h3>
            </div>
            <p className="text-3xl font-bold">{episodeCount.toLocaleString()}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Registered Users</h3>
            </div>
            <p className="text-3xl font-bold">{userCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border-2 border-border bg-card p-8">
          <h2 className="mb-6 text-2xl font-bold">Platform Health</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[{ label: "CPU Usage", value: 42.3 }, { label: "Memory Usage", value: 68.4 }, { label: "Disk Usage", value: 27.1 }].map(
              (metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{metric.label}</span>
                    <span className="text-sm font-bold">{metric.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground" style={{ width: `${metric.value}%` }} />
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="mb-1 text-muted-foreground">Active Connections</p>
              <p className="text-2xl font-bold">512</p>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground">Requests / minute</p>
              <p className="text-2xl font-bold">1,204</p>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">21 days, 4 hours</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold underline">Recent Deployments</h3>
            <ul className="space-y-3 text-sm">
              {recentNovels.map((novel) => (
                <li key={novel.novel_id} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                  <div>
                    <p className="font-medium">{novel.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {novel.created_at ? new Date(novel.created_at).toLocaleDateString() : "recently"}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{novel.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold underline">Tools</h3>
            <div className="grid gap-3 text-sm">
              {[
                "System Logs",
                "Audit Trail",
                "Database Explorer",
                "Feature Flags",
                "Background Jobs",
                "Environment Keys",
              ].map((tool) => (
                <button
                  key={tool}
                  className="rounded-3xl border border-border bg-background px-6 py-3 text-left transition-colors hover:bg-accent"
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
