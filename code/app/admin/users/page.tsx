import { Header } from "@/components/header"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { listUsers } from "@/lib/repositories/users"
import { PrivilegedInviteForm } from "@/components/privileged-invite-form"

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    redirect("/")
  }

  const users = await listUsers(500)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">User Management</h1>

        {user.role === "superadmin" && (
          <div className="mb-8 rounded-3xl border-2 border-border bg-card p-6">
            <PrivilegedInviteForm
              allowedRoles={["reader", "writer", "admin", "developer", "superadmin"]}
              title="Create a new account"
              description="Super Admins can provision any role, including fellow Super Admins."
            />
          </div>
        )}

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
