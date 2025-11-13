import { Header } from "@/components/header"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FollowButton } from "@/components/follow-button"

type PageParams = { id: string }

export default async function AuthorPage(props: { params: PageParams } | { params: Promise<PageParams> }) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const authorId = Number.parseInt(resolvedParams.id)

  if (Number.isNaN(authorId)) {
    notFound()
  }

  const author = await prisma.user.findUnique({
    where: { user_id: authorId },
    select: {
      user_id: true,
      username: true,
      profile_picture: true,
      bio: true,
      novels: {
        orderBy: { last_update: "desc" },
        select: {
          novel_id: true,
          title: true,
          cover_image: true,
          views: true,
          likes: true,
          status: true,
          last_update: true,
        },
      },
    },
  })

  if (!author) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="relative h-36 w-36 overflow-hidden rounded-full bg-muted">
                {author.profile_picture ? (
                  <Image src={author.profile_picture} alt={author.username} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xl font-semibold text-foreground">{author.username?.[0] ?? "A"}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-xl font-bold">{author.username}</h1>
                <p className="text-sm text-muted-foreground">Author</p>
              </div>

              <div className="w-full">
                {/* FollowButton is a client component; it will hydrate on the client */}
                <FollowButton authorId={author.user_id} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              <p className="text-sm text-muted-foreground">{author.bio || "No biography provided."}</p>
            </div>
          </aside>

          <section className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold">Novels by {author.username}</h2>
              <p className="text-sm text-muted-foreground">{author.novels.length} {author.novels.length === 1 ? "novel" : "novels"}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {author.novels.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">This author hasn't published any novels yet.</div>
              ) : (
                author.novels.map((novel) => (
                  <Link
                    key={novel.novel_id}
                    href={`/novel/${novel.novel_id}`}
                    className="group rounded-2xl border border-border bg-card p-4 hover:shadow"
                  >
                    <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-linear-to-br from-blue-100 to-green-100">
                      {novel.cover_image ? (
                        <Image src={novel.cover_image} alt={novel.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">{novel.title}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold line-clamp-2">{novel.title}</h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Views: {(novel.views ?? 0).toLocaleString()}</span>
                        <span>Likes: {(novel.likes ?? 0).toLocaleString()}</span>
                        <span className="capitalize">{(novel.status || "").toLowerCase().replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
