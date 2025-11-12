import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Share2, Star } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"
import { LikeButton } from "@/components/like-button"
import { WishlistButton } from "@/components/wishlist-button"
import { FollowButton } from "@/components/follow-button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, " ")
}

type PageParams = { id: string }

export default async function NovelDetailPage(props: { params: PageParams } | { params: Promise<PageParams> }) {
  const session = await auth()
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const novelId = Number.parseInt(resolvedParams.id)

  if (Number.isNaN(novelId)) {
    notFound()
  }

  const novel = await prisma.novel
    .update({
      where: { novel_id: novelId },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: {
            user_id: true,
            username: true,
            profile_picture: true,
          },
        },
        episodes: {
          orderBy: { episode_id: "asc" },
          select: {
            episode_id: true,
            title: true,
            release_date: true,
          },
        },
        reviews: {
          orderBy: { created_at: "desc" },
          include: {
            user: {
              select: {
                user_id: true,
                username: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    })
    .catch(() => null)

  if (!novel) {
    notFound()
  }

  const userId = session?.user ? Number.parseInt((session.user as any).id) : null
  const hasWishlisted = userId
    ? Boolean(
        await prisma.userWishlist.findUnique({
          where: {
            user_id_novel_id: {
              user_id: userId,
              novel_id: novel.novel_id,
            },
          },
        }),
      )
    : false

  const episodes = novel.episodes.map((episode, index) => ({
    order: index + 1,
    ...episode,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-green-100">
              {novel.cover_image ? (
                <Image src={novel.cover_image} alt={novel.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">Novel</p>
                    <p className="text-lg text-muted-foreground">Cover</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium capitalize">{formatStatus(novel.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Episodes</span>
                <span className="text-sm font-medium">{episodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Views</span>
                <span className="text-sm font-medium">{(novel.views ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rating</span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {Number(novel.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <LikeButton novelId={novel.novel_id} initialLiked={false} />
              <WishlistButton novelId={novel.novel_id} initialWishlisted={hasWishlisted} />
              {novel.author && <FollowButton authorId={novel.author.user_id} />}
              <Button variant="outline" className="w-full rounded-2xl bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">{novel.title}</h1>
              <p className="text-muted-foreground">Author {novel.author?.username ?? "Unknown"}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="mb-3 text-xl font-semibold">Summary</h2>
              <p className="leading-relaxed text-muted-foreground">{novel.description || "No summary available."}</p>
              {novel.tags && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase text-muted-foreground">
                  {novel.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="rounded-full border border-border px-3 py-1">
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {episodes.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-6 text-muted-foreground">No episodes yet.</div>
              ) : (
                episodes.map((episode) => (
                  <Link
                    key={episode.episode_id}
                    href={`/novel/read/${episode.episode_id}`}
                    className="block rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Episode {episode.order}: {episode.title}</h3>
                        {episode.release_date && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(episode.release_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-2xl">
                        Read
                      </Button>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
              {novel.reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {novel.reviews.map((review) => (
                    <div key={review.review_id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{review.user.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Rating: {review.rating}/5</p>
                      {review.comment && <p className="mt-2 text-sm text-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
