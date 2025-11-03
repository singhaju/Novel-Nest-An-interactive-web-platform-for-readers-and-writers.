import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Award } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch user badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select(`
      *,
      badge:badges(*)
    `)
    .eq("user_id", user.id)

  // Fetch reading history
  const { data: readingHistory } = await supabase
    .from("reading_history")
    .select(`
      *,
      novel:novels(title, cover_url),
      chapter:chapters(chapter_number, title)
    `)
    .eq("user_id", user.id)
    .order("read_at", { ascending: false })
    .limit(10)

  // Fetch purchased episodes
  const { data: purchasedEpisodes } = await supabase
    .from("purchased_episodes")
    .select(`
      *,
      chapter:chapters(
        chapter_number,
        title,
        novel:novels(title, cover_url)
      )
    `)
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="relative aspect-square overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-green-100">
              {user.avatar_url ? (
                <Image src={user.avatar_url || "/placeholder.svg"} alt={user.username} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-4xl font-bold text-foreground">Profile</p>
                    <p className="text-xl text-muted-foreground">Picture</p>
                  </div>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Badges</h2>
              <div className="grid grid-cols-2 gap-4">
                {userBadges && userBadges.length > 0 ? (
                  userBadges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-4"
                    >
                      <Award className="h-12 w-12 text-yellow-500" />
                      <span className="text-xs text-center font-medium">{userBadge.badge.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-sm text-muted-foreground py-4">No badges earned yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Profile Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-xl text-muted-foreground mb-4">Name</p>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">Bio</h2>
                <p className="text-muted-foreground leading-relaxed">{user.bio || "No bio added yet."}</p>
              </div>
            </div>

            {/* Reading History */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Reading History</h2>
              <div className="space-y-3">
                {readingHistory && readingHistory.length > 0 ? (
                  readingHistory.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <span className="text-sm font-bold">{history.novel?.title?.[0] || "N"}</span>
                        </div>
                        <span className="font-medium">{history.novel?.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(history.read_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No reading history yet</p>
                )}
              </div>
            </div>

            {/* Purchased Episodes */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Purchased Episodes</h2>
              <div className="space-y-3">
                {purchasedEpisodes && purchasedEpisodes.length > 0 ? (
                  purchasedEpisodes.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <span className="text-sm font-bold">{purchase.chapter?.novel?.title?.[0] || "N"}</span>
                        </div>
                        <span className="font-medium">{purchase.chapter?.novel?.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No purchased episodes yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
