import { Header } from "@/components/header"
import { CreateChapterForm } from "@/components/create-chapter-form"
import { getCurrentUser } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"

export default async function CreateChapterPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user || (user.role !== "author" && user.role !== "admin" && user.role !== "developer")) {
    redirect("/")
  }

  const supabase = await createClient()

  const { data: novel } = await supabase
    .from("novels")
    .select("title")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .single()

  if (!novel) {
    notFound()
  }

  // Get next chapter number
  const { count } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("novel_id", params.id)

  const nextChapterNumber = (count || 0) + 1

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Add New Chapter</h1>
        <p className="text-muted-foreground mb-8">{novel.title}</p>
        <CreateChapterForm novelId={params.id} chapterNumber={nextChapterNumber} />
      </main>
    </div>
  )
}
