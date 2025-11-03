import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminNovelsPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: novels } = await supabase
    .from("novels")
    .select(`
      *,
      author:profiles(username)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Novel Management</h1>

        <div className="space-y-4">
          {novels?.map((novel) => (
            <div key={novel.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{novel.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {novel.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">by {novel.author.username}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{novel.total_views} views</span>
                    <span>{novel.total_likes} likes</span>
                    <span>Rating: {novel.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/novel/${novel.id}`} className="text-sm text-primary hover:underline">
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
