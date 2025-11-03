import type { Novel } from "@/lib/types/database"
import { NovelCard } from "./novel-card"

interface NovelGridProps {
  novels: (Novel & { author?: { username: string } })[]
}

export function NovelGrid({ novels }: NovelGridProps) {
  if (novels.length === 0) {
    return (
      <div className="rounded-2xl bg-muted p-12 text-center">
        <p className="text-muted-foreground">No novels found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {novels.map((novel) => (
        <NovelCard key={novel.id} novel={novel} />
      ))}
    </div>
  )
}
