import { Header } from "@/components/header"
import { NovelGrid } from "@/components/novel-grid"
import { apiClient } from "@/lib/api-client"

export default async function NovelsPage() {
  const data = await apiClient.getNovels({ status: "ongoing,completed" })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">All Novels</h1>
        <NovelGrid novels={data.novels || []} />
      </main>
    </div>
  )
}
