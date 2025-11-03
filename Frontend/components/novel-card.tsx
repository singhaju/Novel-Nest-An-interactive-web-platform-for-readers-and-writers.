import Link from "next/link"
import Image from "next/image"
import type { Novel } from "@/lib/types/database"
import { Eye, Heart, List } from "lucide-react"

interface NovelCardProps {
  novel: Novel & { author?: { username: string } }
}

export function NovelCard({ novel }: NovelCardProps) {
  return (
    <Link href={`/novel/${novel.id}`} className="group">
      <div className="space-y-2">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-green-100">
          {novel.cover_url ? (
            <Image
              src={novel.cover_url || "/placeholder.svg"}
              alt={novel.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center p-4">
                <p className="text-lg font-bold text-foreground">Novel</p>
                <p className="text-sm text-muted-foreground">Cover</p>
              </div>
            </div>
          )}
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
