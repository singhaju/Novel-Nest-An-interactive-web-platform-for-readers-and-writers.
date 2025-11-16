import Link from "next/link"
import Image from "next/image"
import type { Novel } from "@/lib/types/database"
import { Eye, Heart, List } from "lucide-react"
import { normalizeCoverImageUrl } from "@/lib/utils"

interface NovelCardProps {
  novel: Novel & { author?: { username: string } }
}

export function NovelCard({ novel }: NovelCardProps) {
  const normalizedCover = normalizeCoverImageUrl(novel.cover_url)
  const coverSrc = normalizedCover && normalizedCover.trim().length > 0 ? normalizedCover : "/placeholder.svg"

  return (
    <Link href={`/novel/${novel.id}`} className="group">
      <div className="space-y-2">
        {/* Cover Image */}
  <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-linear-to-br from-blue-100 to-green-100">
          <Image
            src={coverSrc}
            alt={novel.title}
            fill
            sizes="(min-width: 1024px) 200px, 40vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>

        {/* Novel Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary">{novel.title}</h3>
          <p className="text-sm text-muted-foreground">{novel.author?.username || "Unknown Author"}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <List className="h-3 w-3" />
              Ch
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {novel.total_views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {novel.total_likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
