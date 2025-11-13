import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Novel } from "@/lib/types/database"
import { NovelCard } from "@/components/novel-card"

interface NovelRailProps {
  title: string
  description?: string
  novels: Novel[]
  ctaHref?: string
  ctaLabel?: string
}

export function NovelRail({ title, description, novels, ctaHref, ctaLabel }: NovelRailProps) {
  if (!novels || novels.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {ctaHref && ctaLabel ? (
          <Link href={ctaHref} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-6">
          {novels.map((novel) => (
            <div key={novel.id} className="w-[188px] flex-shrink-0 sm:w-[208px] md:w-[220px]">
              <NovelCard novel={novel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
