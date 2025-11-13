import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AuthorNovelsPage() {
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["writer", "admin", "developer"].includes(role)) {
    redirect("/")
  }

  const authorId = Number.parseInt((session.user as any).id)
  const canManageAll = ["admin", "developer"].includes(role)

  const novels = await prisma.novel.findMany({
    where: canManageAll ? {} : { author_id: authorId },
    include: {
      author: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { last_update: "desc" },
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Manage Novels</h1>
          <Link href="/author/novels/create">
            <Button className="rounded-full">Create New Novel</Button>
          </Link>
        </div>

        {novels.length > 0 ? (
          <div className="space-y-4">
            {novels.map((novel) => (
              <Link
                key={novel.novel_id}
                href={`/author/novels/${novel.novel_id}`}
                className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{novel.title}</h3>
                    {canManageAll && novel.author?.username && (
                      <p className="text-sm text-muted-foreground">Author: {novel.author.username}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{novel.status.toLowerCase()}</span>
                      <span>{(novel.views ?? 0).toLocaleString()} views</span>
                      <span>{(novel.likes ?? 0).toLocaleString()} likes</span>
                      <span>Rating: {Number(novel.rating ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <Button variant="outline">Manage</Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="mb-4 text-muted-foreground">You haven't created any novels yet</p>
            <Link href="/author/novels/create">
              <Button>Create Your First Novel</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
