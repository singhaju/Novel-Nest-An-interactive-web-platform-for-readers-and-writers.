import { Header } from "@/components/header"
import { NovelGrid } from "@/components/novel-grid"
import { createClient } from "@/lib/supabase/server"

export default async function NovelsPage() {
  const supabase = await createClient()

  const { data: novels } = await supabase
    .from("novels")
    .select(`
      *,
      author:profiles(username)
    `)
    .in("status", ["ongoing", "completed"])
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">All Novels</h1>
        <NovelGrid novels={novels || []} />
      </main>
    </div>
  )
}
