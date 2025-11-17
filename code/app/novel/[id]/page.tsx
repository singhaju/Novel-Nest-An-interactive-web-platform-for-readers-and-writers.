import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"
import { LikeButton } from "@/components/like-button"
import { WishlistButton } from "@/components/wishlist-button"
import { FollowButton } from "@/components/follow-button"
import { ShareButton } from "@/components/share-button"
import { ReviewForm } from "@/components/review-form"
import { auth } from "@/lib/auth"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"
import { getNovelDetail, incrementNovelViews } from "@/lib/repositories/novels"
import { hasUserLikedNovel } from "@/lib/repositories/likes"
import { isNovelInWishlist } from "@/lib/repositories/wishlist"

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

  const userId = session?.user ? Number.parseInt((session.user as any).id) : null

  const detail = await getNovelDetail(novelId)

  if (!detail) {
    notFound()
  }

  await incrementNovelViews(novelId)

  const novel = {
    ...detail.novel,
    author: detail.novel.author_user_id
      ? {
          user_id: detail.novel.author_user_id,
          username: detail.novel.author_username,
          profile_picture: detail.novel.author_profile_picture,
        }
      : null,
    episodes: detail.episodes,
    reviews: detail.reviews.map((review) => ({
      review_id: review.review_id,
      novel_id: review.novel_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      user: {
        user_id: review.review_user_id,
        username: review.review_username,
        profile_picture: review.review_profile_picture,
      },
    })),
  }

  const [hasLiked, hasWishlisted] = await Promise.all([
    userId ? hasUserLikedNovel(userId, novelId) : Promise.resolve(false),
    userId ? isNovelInWishlist(userId, novelId) : Promise.resolve(false),
  ])

  const approvedEpisodes = novel.episodes.filter(
    (episode) => (episode.status ?? "").toUpperCase() === "APPROVED",
  )

  const episodes = approvedEpisodes.map((episode, index) => ({
    order: index + 1,
    ...episode,
  }))

  const coverImageUrl = normalizeCoverImageUrl(novel.cover_image)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-linear-to-br from-blue-100 to-green-100">
              {coverImageUrl ? (
                <Image src={coverImageUrl} alt={novel.title} fill className="object-cover" />
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
              <LikeButton
                novelId={novel.novel_id}
                initialLiked={hasLiked}
                initialLikes={novel.likes ?? 0}
              />
              <WishlistButton novelId={novel.novel_id} initialWishlisted={hasWishlisted} />
              {novel.author && <FollowButton authorId={novel.author.user_id} />}
              <ShareButton title={novel.title} path={`/novel/${novel.novel_id}`} className="w-full rounded-2xl" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">{novel.title}</h1>
              <p className="text-muted-foreground">
                Author{" "}
                {novel.author ? (
                  <Link
                    href={`/author/${novel.author.user_id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {novel.author.username}
                  </Link>
                ) : (
                  "Unknown"
                )}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="mb-3 text-xl font-semibold">Summary</h2>
              <p className="leading-relaxed text-muted-foreground">{novel.description || "No summary available."}</p>
              {novel.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {novel.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .map((tag) => tag.replace(/[\[\]"]/g, ""))
                    .map((tag) => tag.replace(/_/g, " "))
                    .map((tag) => tag.replace(/\s+/g, " ").trim())
                    .filter(Boolean)
                    .map((tag) => {
                      const display = tag.replace(/\b\w/g, (char) => char.toUpperCase())
                      return (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {display}
                        </span>
                      )
                    })}
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
              {session?.user ? (
                <ReviewForm novelId={novel.novel_id} className="mb-4" />
              ) : (
                <p className="mb-4 text-sm text-muted-foreground">
                  <Link href="/auth/login" className="font-medium text-primary hover:underline">
                    Log in
                  </Link>{" "}
                  to post a review.
                </p>
              )}
              {novel.reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {novel.reviews.map((review) => (
                    <div key={review.review_id} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                            {normalizeProfileImageUrl(review.user.profile_picture) ? (
                              <Image
                                src={normalizeProfileImageUrl(review.user.profile_picture)!}
                                alt={review.user.username ?? "Reviewer avatar"}
                                width={36}
                                height={36}
                                className="h-9 w-9 object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold">{review.user.username?.[0]?.toUpperCase() ?? "R"}</span>
                            )}
                          </div>
                          <span className="font-semibold">{review.user.username}</span>
                        </div>
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
