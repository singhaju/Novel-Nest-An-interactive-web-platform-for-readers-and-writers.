import { Header } from "@/components/header"
import { NovelGrid } from "@/components/novel-grid"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import AvatarUploader from "@/components/avatar-uploader"
import { BioForm } from "@/components/bio-form"
import { normalizeCoverImageUrl, normalizeProfileImageUrl } from "@/lib/utils"
import Link from "next/link"
import type { Session } from "next-auth"
import type { Novel } from "@/lib/types/database"
import { findUserById } from "@/lib/repositories/users"
import { listReadingProgressByUser } from "@/lib/repositories/reading-progress"
import { listLikedNovelsByUser } from "@/lib/repositories/likes"
import type { LikedNovelRow } from "@/lib/repositories/likes"
import { listWishlistByUser } from "@/lib/repositories/wishlist"
import type { WishlistRow } from "@/lib/repositories/wishlist"
import { listFollowingAuthors } from "@/lib/repositories/follows"

type DbNovelForGrid = (LikedNovelRow | WishlistRow) & { author_id?: number | null }

function mapNovelForGrid(novel: DbNovelForGrid): Novel & { author?: { username: string } } {
  const authorId = novel.author_id ?? novel.author_user_id ?? 0
  return {
    id: String(novel.novel_id),
    title: novel.title,
    author_id: String(authorId),
    summary: novel.description ?? undefined,
    cover_url: normalizeCoverImageUrl(novel.cover_image) ?? undefined,
    status: novel.status.toLowerCase() as Novel["status"],
    total_views: novel.views ?? 0,
    total_likes: novel.likes ?? 0,
    rating: Number(novel.rating ?? 0),
    genre: novel.tags ?? undefined,
    created_at: novel.created_at.toISOString(),
    updated_at: novel.last_update.toISOString(),
    author: novel.author_username ? ({ username: novel.author_username ?? "Unknown" } as any) : undefined,
  } as Novel & { author?: { username: string } }
}

export default async function ProfilePage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const user = session.user
  const userId = Number.parseInt((user as any).id, 10)

  const dbUser = await findUserById(userId)

  if (!dbUser) {
    redirect("/auth/login")
  }

  const profileImageUrl = normalizeProfileImageUrl(dbUser.profile_picture)
  const [readingProgress, likedNovels, wishlistItems, followingAuthors] = await Promise.all([
    listReadingProgressByUser(userId),
    listLikedNovelsByUser(userId),
    listWishlistByUser(userId),
    listFollowingAuthors(userId),
  ])


  const likedNovelCards = likedNovels.map((item) => mapNovelForGrid(item))

  const wishlistNovelCards = wishlistItems.map((item) => mapNovelForGrid(item))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Left Sidebar */}
          <div className="space-y-6">
              {/* Profile Picture (client) */}
              <div>
                {/* AvatarUploader is a client component so import dynamically to avoid SSR issues */}
                <AvatarUploader initialSrc={profileImageUrl ?? null} username={dbUser.username ?? user.name ?? "Reader"} />
              </div>

            {/* Badges */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Badges</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 text-center text-sm text-muted-foreground py-4">No badges earned yet</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Profile Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{dbUser.username ?? user.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{dbUser.email ?? user.email}</p>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">Bio</h2>
                <BioForm initialBio={dbUser.bio} />
              </div>
            </div>

            <div className="space-y-6">
              {/* Reading History */}
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Reading Progress</h2>
                <div className="space-y-3">
                  {readingProgress.length > 0 ? (
                    readingProgress.map((progress) => {
                      const episodeId = progress.last_read_episode_id
                      const novelId = progress.novel_id
                      const novelTitle = progress.novel_title ?? "Unknown Novel"
                      const href = episodeId ? `/novel/read/${episodeId}` : novelId ? `/novel/${novelId}` : "/"

                      return (
                        <Link key={`${progress.user_id}-${progress.novel_id}`} href={href} className="block">
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <span className="text-sm font-bold">{novelTitle?.[0] || "N"}</span>
                              </div>
                              <span className="font-medium">{novelTitle}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(progress.updated_at, { addSuffix: true })}
                            </span>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No reading history yet</p>
                  )}
                </div>
              </div>

              {/* Liked Novels */}
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Liked Novels</h2>
                  <span className="text-sm text-muted-foreground">{likedNovelCards.length} likes</span>
                </div>
                <div className="mt-4">
                  {likedNovelCards.length > 0 ? (
                    <NovelGrid novels={likedNovelCards} />
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border py-6 text-center text-muted-foreground">
                      You haven&apos;t liked any novels yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Wishlist */}
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Wishlist</h2>
                  <span className="text-sm text-muted-foreground">{wishlistNovelCards.length} saved</span>
                </div>
                <div className="mt-4">
                  {wishlistNovelCards.length > 0 ? (
                    <NovelGrid novels={wishlistNovelCards} />
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border py-6 text-center text-muted-foreground">
                      Add novels to your wishlist to read later.
                    </p>
                  )}
                </div>
              </div>

              {/* Following Authors */}
              <div id="following-authors" className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Following Authors</h2>
                  <span className="text-sm text-muted-foreground">{followingAuthors.length} authors</span>
                </div>
                <div className="mt-4 space-y-3">
                  {followingAuthors.length > 0 ? (
                    followingAuthors.map((follow) => {
                      const avatarUrl = normalizeProfileImageUrl(follow.profile_picture)
                      const authorId = follow.user_id ?? follow.following_id

                      return (
                        <Link
                          key={`${follow.follower_id}-${follow.following_id}`}
                          href={`/author/${authorId}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                                {avatarUrl ? (
                                  <Image
                                    src={avatarUrl}
                                    alt={follow.username ?? "Author"}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold">
                                    {follow.username?.[0]?.toUpperCase() ?? "A"}
                                  </span>
                                )}
                              </div>
                            <div>
                              <p className="font-medium text-foreground">{follow.username ?? "Unknown Author"}</p>
                              {follow.bio ? (
                                <p className="text-sm text-muted-foreground line-clamp-2">{follow.bio}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No bio yet.</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Following since {formatDistanceToNow(follow.followed_at, { addSuffix: true })}
                          </span>
                        </div>
                        </Link>
                      )
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border py-6 text-center text-muted-foreground">
                      Follow authors to get updates on their latest releases.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* User Management section removed */}
          </div>
        </div>
      </main>
    </div>
  )
}
