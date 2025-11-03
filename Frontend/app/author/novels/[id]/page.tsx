import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function ManageNovelPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user || (user.role !== "author" && user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: novel } = await supabase
    .from("novels")
    .select("*")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .single()

  if (!novel) {
    notFound()
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("novel_id", params.id)
    .order("chapter_number", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{novel.title}</h1>
          <p className="text-muted-foreground capitalize">Status: {novel.status}</p>
        </div>

        {/* Novel Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Chapters</p>
            <p className="text-2xl font-bold">{chapters?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Views</p>
            <p className="text-2xl font-bold">{novel.total_views}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Likes</p>
            <p className="text-2xl font-bold">{novel.total_likes}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Rating</p>
            <p className="text-2xl font-bold">{novel.rating.toFixed(1)}</p>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Chapters</h2>
          <Link href={`/author/novels/${params.id}/chapters/create`}>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </Link>
        </div>

        {chapters && chapters.length > 0 ? (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/author/novels/${params.id}/chapters/${chapter.id}`}
                className="block rounded-2xl border border-border bg-card p-6 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Chapter {chapter.chapter_number}: {chapter.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {chapter.views} views
                      {chapter.is_premium && " • Premium"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No chapters yet</p>
            <Link href={`/author/novels/${params.id}/chapters/create`}>
              <Button>Add First Chapter</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
