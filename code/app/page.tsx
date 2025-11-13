import Link from "next/link"
import { Header } from "@/components/header"
import { apiClient } from "@/lib/api-client"
import { HeroSection } from "@/components/home/hero-section"
import { NovelRail } from "@/components/home/novel-rail"
import { DiscoveryGrid } from "@/components/home/discovery-grid"
import { ValueProps } from "@/components/home/value-props"
import { CtaBanner } from "@/components/home/cta-banner"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Novel } from "@/lib/types/database"
import { normalizeTag, slugify } from "@/lib/tags"

export default async function HomePage() {
  const session = await auth()

  const [recommendedRes, trendingRes, freshRes, fantasyRes] = await Promise.all([
    apiClient.getNovels({ limit: 12, status: "ONGOING" }),
    apiClient.getNovels({ limit: 10, status: "ONGOING", offset: 2 }),
    apiClient.getNovels({ limit: 10, status: "ONGOING", offset: 12 }),
    apiClient.getNovels({ limit: 8, genre: "fantasy" }),
  ])

  const recommendedNovels = (recommendedRes.novels ?? []) as Novel[]
  const trendingNovels = (trendingRes.novels ?? []) as Novel[]
  const freshUpdates = (freshRes.novels ?? []) as Novel[]
  const fantasyCollection = (fantasyRes.novels ?? []) as Novel[]

  // Featured story: use personalized novels (wishlist or followed authors) only.
  // If no personalized novels, do not show a featured story here.
  let featured: Novel | undefined = undefined
  const recommendedSectionNovels = (recommendedNovels.length >= 5 ? recommendedNovels : [...recommendedNovels, ...trendingNovels])
    .filter((novel: Novel, index: number, self: Novel[]) => self.findIndex((candidate) => candidate.id === novel.id) === index)
    .slice(0, 6)
  const _discoveryBase = [
    {
      label: "Epic Fantasy",
      description: "World-hopping sagas filled with ancient prophecies and reluctant heroes.",
      accent: "from-blue-400/40 via-purple-400/40 to-cyan-400/40",
      novels: fantasyCollection,
    },
    {
      label: "Slow Burn Romance",
      description: "Friends-to-lovers, rivals-to-soulmates, and everything in between.",
      accent: "from-pink-400/40 via-red-400/40 to-orange-400/40",
      novels: freshUpdates,
    },
    {
      label: "LitRPG Progression",
      description: "Skill trees, dungeon crawls, and stat sheets for gamers at heart.",
      accent: "from-emerald-400/40 via-lime-400/40 to-teal-400/40",
      novels: trendingNovels,
    },
    {
      label: "Mystery & Thriller",
      description: "Twisty investigations and psychological cat-and-mouse games.",
      accent: "from-slate-500/40 via-blue-500/40 to-indigo-500/40",
      novels: freshUpdates.slice(0, 4),
    },
  ]

  const discoveryItems = _discoveryBase.map((item) => {
    const normalized = normalizeTag(item.label) ?? item.label
    const slug = slugify(normalized)
    return { ...item, href: `/novels#${slug}` }
  })

  const role = typeof session?.user?.role === "string" ? (session.user.role || "").toLowerCase() : null

  // If authenticated, fetch wishlist novels and novels from followed authors to personalise featured story
  let personalizedNovels: any[] | undefined = undefined
  if (session?.user) {
    const userId = Number.parseInt((session.user as any).id)

    const [wishlistItems, followingAuthors] = await Promise.all([
      prisma.userWishlist.findMany({
        where: { user_id: userId },
        include: { novel: { include: { author: { select: { user_id: true, username: true } } } } },
        orderBy: { added_at: "desc" },
      }),
      prisma.userFollow.findMany({
        where: { follower_id: userId },
        select: { following_id: true },
      }),
    ])

    const followedAuthorIds = followingAuthors.map((f) => f.following_id)

    const followedNovels = followedAuthorIds.length
      ? await prisma.novel.findMany({
          where: { author_id: { in: followedAuthorIds }, status: "ONGOING" },
          orderBy: { created_at: "desc" },
          include: { author: { select: { user_id: true, username: true } } },
          take: 4,
        })
      : []

    const wishlistNovels = wishlistItems.map((w) => w.novel).filter(Boolean)

    // Merge wishlist novels first, then followed authors' novels, dedupe by novel_id
    const merged = [...wishlistNovels, ...followedNovels]
    const deduped: any[] = []
    const seen = new Set<number>()
    for (const n of merged) {
      if (!n) continue
      const id = (n as any).novel_id || (n as any).id || 0
      if (!seen.has(id)) {
        seen.add(id)
        deduped.push(n)
      }
    }

    personalizedNovels = deduped.slice(0, 4)
  }
  // If user has personalized novels (wishlist or followed authors), pick the first as featured
  if (personalizedNovels && personalizedNovels.length > 0) {
    // Cast to the app Novel type — shapes come from different sources but HeroSection accepts the prop
    featured = personalizedNovels[0] as any as Novel
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="space-y-16 py-12">
        <HeroSection
          featured={featured}
          isAuthenticated={Boolean(session?.user)}
          role={role}
          personalizedNovels={personalizedNovels}
          stats={{ novelCount: Math.max(recommendedNovels.length + trendingNovels.length + freshUpdates.length, 24), writerCount: 120 }}
        />

        <section className="container mx-auto space-y-16 px-4">
          <NovelRail
            title="Recommended for you"
            description="Hand-picked stories to get you started. Updated frequently with community favourites."
            novels={recommendedSectionNovels}
            ctaHref="/novels?sort=recommended"
            ctaLabel="See all recommendations"
          />

          <NovelRail
            title="Trending right now"
            description="Stories readers can’t put down this week. Updated hourly based on views and likes."
            novels={trendingNovels.slice(0, 8)}
            ctaHref="/novels?sort=trending"
            ctaLabel="View full charts"
          />

          <NovelRail
            title="Fresh chapters"
            description="Brand-new uploads from writers you follow and rising stars in the community."
            novels={freshUpdates.slice(0, 8)}
            ctaHref="/novels?sort=recent"
            ctaLabel="See what’s new"
          />

          <DiscoveryGrid items={discoveryItems} />

          <ValueProps />

          <CtaBanner isAuthenticated={Boolean(session?.user)} role={role} />
        </section>

        <footer className="border-t border-border py-12">
          <div className="container mx-auto flex flex-col gap-6 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-foreground">Novel Nest</p>
              <p className="text-xs">Built for readers and writers. Always free to explore.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/support" className="hover:text-foreground">
                Support
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
