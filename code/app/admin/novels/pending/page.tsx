import { Header } from "@/components/header"
import Link from "next/link"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { ApproveNovelButton } from "@/components/approve-novel-button"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"

export default async function PendingNovelsPage() {
  const user = await getCurrentUser()

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/")
  }

  const novels = await prisma.novel.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { created_at: "desc" },
    include: {
      author: {
        select: {
          username: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Pending Novel Approvals</h1>

        {novels.length > 0 ? (
          <div className="space-y-4">
            {novels.map((novel) => (
              <div key={novel.novel_id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{novel.title}</h3>
                      <Badge variant="outline">Submitted</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {novel.author?.username ?? "Unknown"} • {new Date(novel.created_at).toLocaleDateString()}
                    </p>
                    {novel.tags && <p className="mb-2 text-sm text-muted-foreground">Tags: {novel.tags}</p>}
                    {novel.description ? (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-4">{novel.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/novels/pending/${novel.novel_id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View submission
                      </Link>
                      {novel.cover_image && (
                        <span className="text-sm text-muted-foreground">
                          Cover provided
                        </span>
                      )}
                    </div>
                  </div>
                  <ApproveNovelButton novelId={String(novel.novel_id)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        )}
      </main>
    </div>
  )
}
