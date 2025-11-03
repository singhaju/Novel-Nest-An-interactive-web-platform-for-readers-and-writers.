import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CommentSection } from "@/components/comment-section"

export default async function ReadChapterPage({ params }: { params: { chapterId: string } }) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: chapter } = await supabase
    .from("chapters")
    .select(`
      *,
      novel:novels(
        id,
        title,
        author:profiles(username)
      )
    `)
    .eq("id", params.chapterId)
    .single()

  if (!chapter) {
    notFound()
  }

  // Get previous and next chapters
  const { data: prevChapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("novel_id", chapter.novel_id)
    .lt("chapter_number", chapter.chapter_number)
    .order("chapter_number", { ascending: false })
    .limit(1)
    .single()

  const { data: nextChapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("novel_id", chapter.novel_id)
    .gt("chapter_number", chapter.chapter_number)
    .order("chapter_number", { ascending: true })
    .limit(1)
    .single()

  // Increment view count
  await supabase.rpc("increment_chapter_views", { chapter_uuid: params.chapterId })

  // Add to reading history if user is logged in
  if (user) {
    await supabase.from("reading_history").upsert({
      user_id: user.id,
      chapter_id: params.chapterId,
      novel_id: chapter.novel_id,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Chapter Header */}
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Story: {chapter.novel.title}</p>
          <h1 className="text-4xl font-bold text-foreground mb-2">Chapter {chapter.chapter_number}</h1>
          <p className="text-xl text-muted-foreground">Author {chapter.novel.author.username}</p>
        </div>

        {/* Chapter Content */}
        <div className="mb-8 rounded-3xl border border-border bg-card p-8">
          <div className="prose prose-lg max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{chapter.content}</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mb-8 flex gap-4">
          {prevChapter ? (
            <Link href={`/novel/read/${prevChapter.id}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-3xl py-6 bg-transparent">
                Previous Episode
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="flex-1 rounded-3xl py-6 bg-transparent">
              Previous Episode
            </Button>
          )}

          {nextChapter ? (
            <Link href={`/novel/read/${nextChapter.id}`} className="flex-1">
              <Button className="w-full rounded-3xl py-6">Next Episode</Button>
            </Link>
          ) : (
            <Button disabled className="flex-1 rounded-3xl py-6">
              Next Episode
            </Button>
          )}
        </div>

        {/* Comments Section */}
        <CommentSection chapterId={params.chapterId} />
      </main>
    </div>
  )
}
