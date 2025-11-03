import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, FileText, Eye } from "lucide-react"

export default async function AuthorDashboardPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "author" && user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  // Fetch author's novels
  const { data: novels } = await supabase.from("novels").select("*").eq("author_id", user.id)

  // Calculate total episodes
  const { count: totalEpisodes } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .in("novel_id", novels?.map((n) => n.id) || [])

  // Calculate total views
  const totalViews = novels?.reduce((sum, novel) => sum + novel.total_views, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Author Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Novels</h3>
            </div>
            <p className="text-4xl font-bold">{novels?.length || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Episodes</h3>
            </div>
            <p className="text-4xl font-bold">{totalEpisodes || 0}</p>
          </div>

          <div className="rounded-3xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
            </div>
            <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/author/novels/create">
              <Button className="w-full h-24 rounded-3xl text-lg">Create New Novel</Button>
            </Link>
            <Link href="/author/novels">
              <Button variant="outline" className="w-full h-24 rounded-3xl text-lg bg-transparent">
                Manage Novel
              </Button>
            </Link>
          </div>
        </section>

        {/* Your Novels */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Your Novels</h2>
            <Link href="/author/novels">
              <Button variant="outline" className="rounded-full bg-transparent">
                view all
              </Button>
            </Link>
          </div>

          {novels && novels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {novels.slice(0, 6).map((novel) => (
                <Link
                  key={novel.id}
                  href={`/author/novels/${novel.id}`}
                  className="rounded-2xl border border-border bg-card p-6 hover:bg-accent transition-colors"
                >
                  <h3 className="font-semibold text-lg mb-2">{novel.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="capitalize">{novel.status}</span>
                    <span>{novel.total_views} views</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any novels yet</p>
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
