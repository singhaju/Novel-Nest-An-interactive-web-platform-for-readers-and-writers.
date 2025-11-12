import { Header } from "@/components/header"
import { NovelGrid } from "@/components/novel-grid"
import { apiClient } from "@/lib/api-client"
import type { Novel } from "@/lib/types/database"

const MAX_PER_CATEGORY = 12
const TAG_PRIORITY = [
  "fantasy",
  "romance",
  "science fiction",
  "thriller",
  "mystery",
  "adventure",
  "drama",
  "comedy",
  "litrpg",
  "horror",
  "slice of life",
  "historical",
  "supernatural",
  "young adult",
]

const TAG_ALIASES: Record<string, string> = {
  "sci fi": "science fiction",
  "sci-fi": "science fiction",
  "science-fiction": "science fiction",
  "lit rpg": "litrpg",
  "lit-rpg": "litrpg",
  "young-adult": "young adult",
  ya: "young adult",
}

const TAG_DISPLAY_OVERRIDES: Record<string, string> = {
  "science fiction": "Science Fiction",
  litrpg: "LitRPG",
  "slice of life": "Slice of Life",
  "young adult": "Young Adult",
}

type NovelWithAuthor = Novel & { author?: { username: string } }

function normalizeTag(raw: string): string | null {
  if (!raw) return null
  let normalized = raw
    .toLowerCase()
    .replace(/[\[\]"]+/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!normalized) {
    return null
  }

  normalized = TAG_ALIASES[normalized] ?? normalized
  return normalized
}

function extractNormalizedTags(tagField?: string): string[] {
  if (!tagField) return []

  const parsed = tagField
    .split(/[,/]/)
    .map((tag) => normalizeTag(tag))
    .filter((tag): tag is string => Boolean(tag))

  return Array.from(new Set(parsed))
}

function formatTagLabel(tag: string): string {
  if (TAG_DISPLAY_OVERRIDES[tag]) {
    return TAG_DISPLAY_OVERRIDES[tag]
  }

  return tag
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function groupNovelsByTag(novels: NovelWithAuthor[]) {
  const buckets = new Map<string, { label: string; novels: NovelWithAuthor[] }>()
  const untagged: NovelWithAuthor[] = []

  for (const novel of novels) {
    const tags = extractNormalizedTags(novel.genre)

    if (tags.length === 0) {
      if (untagged.length < MAX_PER_CATEGORY) {
        untagged.push(novel)
      }
      continue
    }

    for (const tag of tags) {
      const existing = buckets.get(tag)
      if (existing) {
        if (existing.novels.length < MAX_PER_CATEGORY) {
          existing.novels.push(novel)
        }
      } else {
        buckets.set(tag, {
          label: formatTagLabel(tag),
          novels: [novel],
        })
      }
    }
  }

  const sections: { value: string; label: string; novels: NovelWithAuthor[] }[] = []

  for (const tag of TAG_PRIORITY) {
    if (buckets.has(tag)) {
      const bucket = buckets.get(tag)!
      sections.push({ value: tag, label: bucket.label, novels: bucket.novels })
      buckets.delete(tag)
    }
  }

  const remaining = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([value, bucket]) => ({ value, label: bucket.label, novels: bucket.novels }))

  sections.push(...remaining)

  if (untagged.length > 0) {
    sections.push({ value: "other", label: "Other Genres", novels: untagged })
  }

  return sections
}

interface NovelsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}

export default async function NovelsPage({ searchParams }: NovelsPageProps) {
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams
  const rawQuery = resolvedSearchParams?.q
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery

  const normalizedQuery = query?.trim()
  const limit = normalizedQuery ? 60 : 80
  const data = await apiClient.getNovels({ status: "ongoing,completed", query: normalizedQuery || undefined, limit })
  const novels = (data.novels ?? []) as NovelWithAuthor[]
  const sections = normalizedQuery ? [] : groupNovelsByTag(novels)

  const heading = normalizedQuery ? `Results for "${normalizedQuery}"` : "Browse by Tag"
  const totalResults = data.total ?? novels.length
  const description = normalizedQuery
    ? totalResults === 0
      ? "No novels matched your search."
      : totalResults === 1
        ? "Found 1 match"
        : `Found ${totalResults} matches`
    : sections.length === 0
      ? "We couldn't find any tagged novels yet. Check back soon."
      : "Discover stories grouped by the tags our readers love most."

  const shouldShowTagSections = !normalizedQuery && sections.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Header initialQuery={normalizedQuery ?? undefined} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{heading}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {normalizedQuery ? (
          <NovelGrid novels={novels} />
        ) : (
          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold text-foreground">All Novels</h2>
                <span className="text-sm text-muted-foreground">
                  Showing {novels.length} of {totalResults} {totalResults === 1 ? "novel" : "novels"}
                </span>
              </div>
              {novels.length > 0 ? (
                <NovelGrid novels={novels} />
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                  We couldn't find any novels yet. Check back soon.
                </div>
              )}
            </section>

            {shouldShowTagSections ? (
              sections.map((section) => (
                <section key={section.value} className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-semibold text-foreground">{section.label}</h2>
                    <span className="text-sm text-muted-foreground">
                      {section.novels.length} {section.novels.length === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <NovelGrid novels={section.novels} />
                </section>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                We couldn't find any tagged collections just yet. Publish or tag a story to get started.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
