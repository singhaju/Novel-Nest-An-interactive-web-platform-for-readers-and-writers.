"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type PrivilegedRole = "reader" | "writer" | "admin" | "developer" | "superadmin"

const ROLE_LABELS: Record<PrivilegedRole, string> = {
  reader: "Reader",
  writer: "Writer",
  admin: "Admin",
  developer: "Developer",
  superadmin: "Super Admin",
}

interface PrivilegedInviteFormProps {
  allowedRoles: PrivilegedRole[]
  title?: string
  description?: string
}

function formatRole(role: string): string {
  const key = role.toLowerCase() as PrivilegedRole
  const label = ROLE_LABELS[key]
  if (label) {
    return label
  }
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function PrivilegedInviteForm({ allowedRoles, title, description }: PrivilegedInviteFormProps) {
  const { toast } = useToast()
  const initialRole = (allowedRoles[0] ?? "reader") as PrivilegedRole
  const [role, setRole] = useState<PrivilegedRole>(initialRole)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!allowedRoles.length) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!allowedRoles.includes(role)) {
      toast({
        title: "Role not allowed",
        description: "You do not have permission to create that role.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/users/privileged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast({
          title: "Could not create account",
          description: payload.error || "Please review the details and try again.",
        })
        return
      }

      toast({
        title: "Account created",
        description: `${payload.username || username} added as ${formatRole(role)}.`,
      })

      setUsername("")
      setEmail("")
      setPassword("")
    } catch (error) {
      console.error("Failed to create privileged user:", error)
      toast({
        title: "Request failed",
        description: "Something went wrong. Please try again soon.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {title ? <h4 className="text-lg font-semibold text-foreground">{title}</h4> : null}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="invite-username">Username</Label>
          <Input
            id="invite-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="dev_user"
            autoComplete="username"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="invite-password">Password</Label>
          <Input
            id="invite-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
          />
        </div>

        {allowedRoles.length > 1 ? (
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as PrivilegedRole)} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((allowedRole) => (
                  <SelectItem key={allowedRole} value={allowedRole}>
                    {formatRole(allowedRole)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Role: <span className="font-medium text-foreground">{formatRole(allowedRoles[0])}</span>
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="rounded-3xl">
          {isSubmitting ? "Creating..." : "Create account"}
        </Button>
      </form>
    </div>
  )
}
