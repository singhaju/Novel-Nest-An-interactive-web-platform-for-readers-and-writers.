import { Header } from "@/components/header"
import { getCurrentUser } from "@/lib/actions/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">User Management</h1>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((profile) => (
                  <tr key={profile.user_id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">{profile.username}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">
                        {profile.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-primary hover:underline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
