import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AuthorNovelsPage() {
  const user = await getCurrentUser()

  if (!user || (user.role !== "author" && user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: novels } = await supabase
    .from("novels")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Manage Novels</h1>
          <Link href="/author/novels/create">
            <Button className="rounded-full">Create New Novel</Button>
          </Link>
        </div>

        {novels && novels.length > 0 ? (
          <div className="space-y-4">
            {novels.map((novel) => (
              <Link
                key={novel.id}
                href={`/author/novels/${novel.id}`}
                className="block rounded-2xl border border-border bg-card p-6 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{novel.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{novel.status}</span>
                      <span>{novel.total_views} views</span>
                      <span>{novel.total_likes} likes</span>
                      <span>Rating: {novel.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <Button variant="outline">Manage</Button>
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
      </main>
    </div>
  )
}
