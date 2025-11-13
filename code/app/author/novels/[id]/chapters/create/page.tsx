import { Header } from "@/components/header"
import { CreateChapterForm } from "@/components/create-chapter-form"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"

type PageParams = { id: string }

export default async function CreateChapterPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const resolvedParams = props.params instanceof Promise ? await props.params : props.params
  const session = await auth()
  const role = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session || !["writer", "admin", "developer"].includes(role)) {
    redirect("/")
  }

  const userId = Number.parseInt((session.user as any).id)
  const novelId = Number.parseInt(resolvedParams.id)

  if (Number.isNaN(novelId)) {
    notFound()
  }

  const canManageAll = ["admin", "developer"].includes(role)

  const novel = await prisma.novel.findFirst({
    where: canManageAll ? { novel_id: novelId } : { novel_id: novelId, author_id: userId },
    select: {
      title: true,
    },
  })

  if (!novel) {
    notFound()
  }

  const episodeCount = await prisma.episode.count({ where: { novel_id: novelId } })
  const nextChapterNumber = episodeCount + 1

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Add New Episode</h1>
        <p className="mb-8 text-muted-foreground">{novel.title}</p>
        <CreateChapterForm novelId={resolvedParams.id} chapterNumber={nextChapterNumber || 1} />
      </main>
    </div>
  )
}
