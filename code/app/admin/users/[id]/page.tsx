import Image from "next/image"
import Link from "next/link"
import { redirect, notFound } from "next/navigation"

import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminUserBanButton } from "@/components/admin-user-ban-button"
import { AdminUserProfileEditor } from "@/components/admin-user-profile-editor"
import { auth } from "@/lib/auth"
import { findUserById } from "@/lib/repositories/users"
import { normalizeProfileImageUrl } from "@/lib/utils"

const ADMIN_ROLES = new Set(["admin", "superadmin"])
const EDITABLE_ROLES = new Set(["reader", "writer"])

type PageParams = { id: string }

export default async function AdminUserDetailPage(
  props: { params: PageParams } | { params: Promise<PageParams> },
) {
  const session = await auth()
  const actorRole = typeof session?.user?.role === "string" ? session.user.role.toLowerCase() : "reader"

  if (!session?.user || !ADMIN_ROLES.has(actorRole)) {
    redirect("/")
  }

  const resolvedParams = props.params instanceof Promise ? await props.params : props.params

  const userId = Number.parseInt(resolvedParams.id, 10)
  if (!Number.isFinite(userId)) {
    notFound()
  }

  const user = await findUserById(userId)
  if (!user) {
    notFound()
  }

  const normalizedRole = typeof user.role === "string" ? user.role.toLowerCase() : "reader"
  const isBanned = Boolean(user.is_banned)
  const avatarUrl = normalizeProfileImageUrl(user.profile_picture ?? undefined)
  const editable = EDITABLE_ROLES.has(normalizedRole)
  const showAuthorLinks = normalizedRole === "writer"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/admin/users" className="text-primary hover:underline">
                &larr; Back to user list
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-foreground">{user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {normalizedRole}
            </Badge>
            {isBanned && <Badge variant="destructive">Banned</Badge>}
            <AdminUserBanButton userId={user.user_id} username={user.username} role={normalizedRole} isBanned={isBanned} />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4 text-center">
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border border-border bg-muted">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={user.username} width={128} height={128} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {user.username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-lg font-semibold">
                  {new Date(user.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4 text-left text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Bio</p>
                <p className="mt-2 whitespace-pre-wrap">{user.bio || "No bio provided."}</p>
              </div>
            </div>

            {showAuthorLinks ? (
              <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Quick links</h2>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link href={`/author/${user.user_id}`}>View author page</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
                Reader accounts do not have author landing pages.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Profile controls</h2>
                <p className="text-sm text-muted-foreground">
                  {editable ? "Update this reader/writer profile." : "Only reader and writer profiles are editable."}
                </p>
              </div>
            </div>
            <AdminUserProfileEditor
              userId={user.user_id}
              initialUsername={user.username}
              initialEmail={user.email}
              initialBio={user.bio}
              initialProfilePicture={user.profile_picture}
              editable={editable}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
