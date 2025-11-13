import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Novel } from "@/lib/types/database"

interface DiscoveryItem {
  label: string
  description: string
  href: string
  accent: string
  novels?: Novel[]
}

interface DiscoveryGridProps {
  items: DiscoveryItem[]
}

export function DiscoveryGrid({ items }: DiscoveryGridProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Jump into a new world</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">Pick a genre starter pack curated from the most-read series on Novel Nest.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group relative overflow-hidden rounded-3xl border border-border bg-background p-6 transition-transform hover:-translate-y-1"
          >
            <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${item.accent} opacity-10`} />
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div className="space-y-3 md:max-w-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Explore stories
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>

              {item.novels && item.novels.length > 0 ? (
                <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
                  {item.novels.slice(0, 4).map((novel) => (
                    <div key={novel.id} className="rounded-2xl bg-background/60 p-3 shadow-sm">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{novel.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{novel.author?.username || "Unknown author"}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
