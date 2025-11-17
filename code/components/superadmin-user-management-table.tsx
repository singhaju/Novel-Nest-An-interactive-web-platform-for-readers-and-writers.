"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminUserBanButton } from "@/components/admin-user-ban-button"

export type ManagedUserRow = {
  id: number
  username: string | null
  role: string
  joinedAt: string
  isBanned: boolean
}

type SuperadminUserManagementTableProps = {
  users: ManagedUserRow[]
}

export function SuperadminUserManagementTable({ users }: SuperadminUserManagementTableProps) {
  const [showTable, setShowTable] = useState(false)

  const handleToggle = () => {
    setShowTable((previous) => !previous)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {showTable ? "Hide the full user roster when you are done reviewing." : "Reveal the full user roster when needed."}
        </p>
        <Button variant="outline" onClick={handleToggle} className="rounded-2xl">
          {showTable ? "Hide list" : "See all users"}
        </Button>
      </div>

      {showTable && (
        <div className="rounded-2xl border border-border overflow-hidden">
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
                  <tr key={profile.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">{profile.username ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">
                        {profile.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(profile.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-full border border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Link href={`/admin/users/${profile.id}`}>View details</Link>
                        </Button>
                        <AdminUserBanButton
                          userId={profile.id}
                          username={profile.username}
                          role={profile.role}
                          isBanned={profile.isBanned}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
