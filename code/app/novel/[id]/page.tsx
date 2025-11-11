import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Share2, Star } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"
import { LikeButton } from "@/components/like-button"
import { WishlistButton } from "@/components/wishlist-button"
import { FollowButton } from "@/components/follow-button"
import type { Session } from "next-auth"

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session: Session | null = await getServerSession(authOptions)

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/novels/${resolvedParams.id}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    notFound()
  }

  const novel = await response.json()

  const episodesResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/episodes?novelId=${resolvedParams.id}`, {
    cache: "no-store",
  })
  const episodes = episodesResponse.ok ? await episodesResponse.json() : []

  // Check if user has liked/wishlisted
  let hasLiked = false
  let hasWishlisted = false

  if (session?.user) {
    const likeResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/likes?userId=${session.user.id}&novelId=${resolvedParams.id}`,
      { cache: "no-store" },
    )
    if (likeResponse.ok) {
      const likeData = await likeResponse.json()
      hasLiked = likeData.liked
    }

    const wishlistResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/wishlist?userId=${session.user.id}&novelId=${resolvedParams.id}`,
      { cache: "no-store" },
    )
    if (wishlistResponse.ok) {
      const wishlistData = await wishlistResponse.json()
      hasWishlisted = wishlistData.wishlisted
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Cover Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-green-100">
              {novel.cover_image ? (
                <Image src={novel.cover_image || "/placeholder.svg"} alt={novel.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center p-4">
                    <p className="text-2xl font-bold text-foreground">Novel</p>
                    <p className="text-lg text-muted-foreground">Cover</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium capitalize">{novel.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Episode:</span>
                <span className="text-sm font-medium">{episodes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Views:</span>
                <span className="text-sm font-medium">{novel.views || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rating:</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {novel.rating ? Number(novel.rating).toFixed(1) : "0.0"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <LikeButton novelId={Number(resolvedParams.id)} initialLiked={hasLiked} />
              <WishlistButton novelId={Number(resolvedParams.id)} initialWishlisted={hasWishlisted} />

              <FollowButton authorId={novel.author?.id || novel.user_id} />
              <Button variant="outline" className="w-full rounded-2xl bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{novel.title}</h1>
              <p className="text-muted-foreground">Author {novel.author?.username || "Unknown"}</p>
            </div>

            {/* Summary */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-3">Summary</h2>
              <p className="text-muted-foreground leading-relaxed">{novel.description || "No summary available."}</p>
            </div>

            {/* Episodes List */}
            <div className="space-y-3">
              {episodes?.map((episode: any, index: number) => (
                <Link
                  key={episode.id}
                  href={`/novel/read/${episode.id}`}
                  className="block rounded-3xl border border-border bg-card p-6 hover:bg-accent transition-colors"
                >
                  <h3 className="font-semibold">
                    Episode {index + 1} {episode.title}
                  </h3>
                </Link>
              ))}
            </div>

            {/* Reviews Section */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <p className="text-muted-foreground">No reviews yet.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
