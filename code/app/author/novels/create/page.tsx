import { Header } from "@/components/header"
import { CreateNovelForm } from "@/components/create-novel-form"
import { RoleUpgradeCard } from "@/components/role-upgrade-card"
import { getCurrentUser } from "@/lib/actions/auth"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CreateNovelPage() {
  const session = await auth()
  const user = await getCurrentUser(session)

  if (!user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent("/author/novels/create")}`)
  }

  const role = typeof user.role === "string" ? user.role.toLowerCase() : "reader"
  const canCreate = ["writer", "author", "admin", "developer", "superadmin"].includes(role)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Author tools</p>
          <h1 className="text-3xl font-bold text-foreground">Create New Novel</h1>
          <p className="text-muted-foreground">
            {canCreate
              ? "Share a new story with the community. Upload a cover, add tags, and publish chapters whenever you're ready."
              : "Switch into writer mode to unlock the author dashboard and publishing tools while keeping your existing reading history."}
          </p>
        </div>

        {canCreate ? <CreateNovelForm /> : <RoleUpgradeCard currentRole={role} />}
      </main>
    </div>
  )
}
