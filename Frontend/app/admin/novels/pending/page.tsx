import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { ApproveNovelButton } from "@/components/approve-novel-button"

export default async function PendingNovelsPage() {
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
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Pending Novel Approvals</h1>

        {novels && novels.length > 0 ? (
          <div className="space-y-4">
            {novels.map((novel) => (
              <div key={novel.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{novel.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {novel.author.username}</p>
                    <p className="text-sm text-muted-foreground mb-4">{novel.summary}</p>
                  </div>
                  <ApproveNovelButton novelId={novel.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        )}
      </main>
    </div>
  )
}
