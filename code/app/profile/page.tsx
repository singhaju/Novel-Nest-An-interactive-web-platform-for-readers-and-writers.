import { Header } from "@/components/header"
import { NovelGrid } from "@/components/novel-grid"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import AvatarUploader from "@/components/avatar-uploader"
import Link from "next/link"
import type { Session } from "next-auth"
import type { Novel } from "@/lib/types/database"

type PrismaNovelWithAuthor = {
  novel_id: number
  title: string
  description: string | null
  cover_image: string | null
  tags: string | null
  status: string
  views: number | null
  likes: number | null
  rating: any
  created_at: Date
  last_update: Date
  author_id: number
  author: {
    user_id: number
    username: string | null
  } | null
}

function mapNovelForGrid(novel: PrismaNovelWithAuthor): Novel & { author?: { username: string } } {
  return {
    id: String(novel.novel_id),
    title: novel.title,
    author_id: String(novel.author_id),
    summary: novel.description ?? undefined,
    cover_url: novel.cover_image ?? undefined,
    status: novel.status.toLowerCase() as Novel["status"],
    total_views: novel.views ?? 0,
    total_likes: novel.likes ?? 0,
    rating: Number(novel.rating ?? 0),
    genre: novel.tags ?? undefined,
    created_at: novel.created_at.toISOString(),
    updated_at: novel.last_update.toISOString(),
    author: novel.author ? ({ username: novel.author.username ?? "Unknown" } as any) : undefined,
  } as Novel & { author?: { username: string } }
}

export default async function ProfilePage() {
  const session: Session | null = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const user = session.user
  const userId = Number.parseInt((user as any).id, 10)

  const [readingProgress, likedNovels, wishlistItems, followingAuthors] = await Promise.all([
    prisma.userReadingProgress.findMany({
      where: { user_id: userId },
      include: {
        novel: {
          select: {
            novel_id: true,
            title: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
    prisma.novelLike.findMany({
      where: { user_id: userId },
      include: {
        novel: {
          include: {
            author: {
              select: {
                user_id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { novel: { title: "asc" } },
    }),
    prisma.userWishlist.findMany({
      where: { user_id: userId },
      include: {
        novel: {
          include: {
            author: {
              select: {
                user_id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { added_at: "desc" },
    }),
    prisma.userFollow.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            user_id: true,
            username: true,
            profile_picture: true,
            bio: true,
          },
        },
      },
      orderBy: { followed_at: "desc" },
    }),
  ])

  const likedNovelCards = likedNovels
    .filter((item) => item.novel)
    .map((item) => mapNovelForGrid(item.novel as PrismaNovelWithAuthor))

  const wishlistNovelCards = wishlistItems
    .filter((item) => item.novel)
    .map((item) => mapNovelForGrid(item.novel as PrismaNovelWithAuthor))

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
                <AvatarUploader initialSrc={user.profile_picture} username={user.username} />
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
              <h1 className="text-3xl font-bold text-foreground mb-2">{user.username}</h1>
              <p className="text-xl text-muted-foreground mb-4">{user.email}</p>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-2">Bio</h2>
                <p className="text-muted-foreground leading-relaxed">{user.bio || "No bio added yet."}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Reading History */}
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Reading Progress</h2>
                <div className="space-y-3">
                  {readingProgress.length > 0 ? (
                    readingProgress.map((progress) => {
                      const episodeId = (progress as any).last_read_episode_id
                      const novelId = progress.novel?.novel_id
                      const href = episodeId ? `/novel/read/${episodeId}` : novelId ? `/novel/${novelId}` : "/"

                      return (
                        <Link key={`${progress.user_id}-${progress.novel_id}`} href={href} className="block">
                          <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <span className="text-sm font-bold">{progress.novel?.title?.[0] || "N"}</span>
                              </div>
                              <span className="font-medium">{progress.novel?.title ?? "Unknown Novel"}</span>
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
                    followingAuthors.map((follow) => (
                      <Link
                        key={`${follow.follower_id}-${follow.following_id}`}
                        href={`/author/${follow.following?.user_id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                              {follow.following?.profile_picture ? (
                                <Image
                                  src={follow.following.profile_picture}
                                  alt={follow.following.username ?? "Author"}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover"
                                />
                              ) : (
                                <span className="text-sm font-semibold">
                                  {follow.following?.username?.[0]?.toUpperCase() ?? "A"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{follow.following?.username ?? "Unknown Author"}</p>
                              {follow.following?.bio ? (
                                <p className="text-sm text-muted-foreground line-clamp-2">{follow.following.bio}</p>
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
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border py-6 text-center text-muted-foreground">
                      Follow authors to get updates on their latest releases.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
