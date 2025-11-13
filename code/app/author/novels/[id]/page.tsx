import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"

type PageParams = { id: string }

export default async function ManageNovelPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["writer", "admin", "developer"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)
  const novelId = Number.parseInt(resolvedParams.id)

  if (Number.isNaN(novelId)) {
    notFound()
  }

  const canManageAll = ["admin", "developer"].includes(role)

  const novel = await prisma.novel.findFirst({
    where: canManageAll ? { novel_id: novelId } : { novel_id: novelId, author_id: authorId },
    include: {
      episodes: {
        orderBy: { episode_id: "asc" },
        select: {
          episode_id: true,
          title: true,
          release_date: true,
        },
      },
    },
  })

  if (!novel) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">{novel.title}</h1>
          <p className="text-muted-foreground">Status: {novel.status.toLowerCase()}</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Episodes</p>
            <p className="text-2xl font-bold">{novel.episodes.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Views</p>
            <p className="text-2xl font-bold">{(novel.views ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Likes</p>
            <p className="text-2xl font-bold">{(novel.likes ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-sm text-muted-foreground">Rating</p>
            <p className="text-2xl font-bold">{Number(novel.rating ?? 0).toFixed(1)}</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Episodes</h2>
          <Link href={`/author/novels/${resolvedParams.id}/chapters/create`}>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Episode
            </Button>
          </Link>
        </div>

        {novel.episodes.length > 0 ? (
          <div className="space-y-3">
            {novel.episodes.map((episode, index) => (
              <Link
                key={episode.episode_id}
                href={`/author/novels/${resolvedParams.id}/chapters/${episode.episode_id}`}
                className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Episode {index + 1}: {episode.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {episode.release_date ? new Date(episode.release_date).toLocaleDateString() : "Unscheduled"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">No episodes yet</p>
            <Link href={`/author/novels/${resolvedParams.id}/chapters/create`}>
              <Button>Add First Episode</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
