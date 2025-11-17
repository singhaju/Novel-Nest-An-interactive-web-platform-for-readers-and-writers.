"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface AdminUserProfileEditorProps {
  userId: number
  initialUsername: string
  initialEmail: string
  initialBio?: string | null
  initialProfilePicture?: string | null
  editable: boolean
}

export function AdminUserProfileEditor({
  userId,
  initialUsername,
  initialEmail,
  initialBio,
  initialProfilePicture,
  editable,
}: AdminUserProfileEditorProps) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername)
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture ?? "")
  const [bio, setBio] = useState(initialBio ?? "")
  const [pending, setPending] = useState(false)

  if (!editable) {
    return (
      <div className="rounded-3xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Only reader and writer accounts can be edited by admins.
      </div>
    )
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setPending(true)

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          bio,
          profilePicture: profilePicture.trim().length > 0 ? profilePicture.trim() : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update profile")
      }

      toast({
        title: "Profile updated",
        description: `${username} has been updated successfully.`,
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to update profile", error)
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unable to update profile",
        variant: "destructive",
      })
    } finally {
      setPending(false)
    }
  }

  const handleReset = () => {
    setUsername(initialUsername)
    setProfilePicture(initialProfilePicture ?? "")
    setBio(initialBio ?? "")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Username</label>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={2}
          disabled={pending}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <Input value={initialEmail} disabled readOnly />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Profile picture URL</label>
        <Input
          value={profilePicture}
          onChange={(event) => setProfilePicture(event.target.value)}
          disabled={pending}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Bio</label>
        <Textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          disabled={pending}
          rows={4}
          maxLength={2000}
          placeholder="Share a short introduction..."
        />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/2000</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" className="rounded-2xl" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" className="rounded-2xl" disabled={pending} onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  )
}
