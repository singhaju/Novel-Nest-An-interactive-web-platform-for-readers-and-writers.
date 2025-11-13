import { Header } from "@/components/header"
import { CreateNovelForm } from "@/components/create-novel-form"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function CreateNovelPage() {
  const user = await getCurrentUser()

  if (
    !user ||
    !["writer", "author", "admin", "developer"].includes((user.role || "reader").toLowerCase())
  ) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Create New Novel</h1>
        <CreateNovelForm />
      </main>
    </div>
  )
}
