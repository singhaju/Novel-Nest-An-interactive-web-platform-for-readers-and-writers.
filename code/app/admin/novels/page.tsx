import { Header } from "@/components/header"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { listNovelsForManagement } from "@/lib/repositories/novels"

export default async function AdminNovelsPage() {
  const user = await getCurrentUser()

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/")
  }

  const novels = await listNovelsForManagement()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Novel Management</h1>

        <div className="space-y-4">
          {novels.map((novel) => (
            <div key={novel.novel_id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{novel.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {novel.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">by {novel.author_username ?? "Unknown"}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{Number(novel.views ?? 0).toLocaleString()} views</span>
                    <span>{Number(novel.likes ?? 0).toLocaleString()} likes</span>
                    <span>Rating: {Number(novel.rating ?? 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/author/novels/${novel.novel_id}`}
                    className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-100"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/novel/${novel.novel_id}`}
                    className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
