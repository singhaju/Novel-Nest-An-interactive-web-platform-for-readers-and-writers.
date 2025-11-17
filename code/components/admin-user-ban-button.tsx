"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Ban, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const MANAGEABLE_ROLES = new Set(["reader", "writer"])

type AdminUserBanButtonProps = {
  userId: number
  username?: string | null
  role: string
  isBanned?: boolean
}

export function AdminUserBanButton({ userId, username, role, isBanned }: AdminUserBanButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "reader"
  const canManage = MANAGEABLE_ROLES.has(normalizedRole)
  const actionLabel = isBanned ? "Unban" : "Ban"
  const tone = isBanned
    ? {
        iconButton: "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
        actionButton: "border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 text-white",
        icon: "text-emerald-900",
        warningTitle: "Do you want to unban this user?",
        warningBody: "They will regain access immediately and can continue where they left off.",
      }
    : {
        iconButton: "border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100",
        actionButton: "border border-rose-600 bg-rose-600 hover:bg-rose-500 text-white",
        icon: "text-rose-900",
        warningTitle: "This user will be locked out",
        warningBody: "They will lose access to their account and any in-progress drafts.",
      }

  const handleConfirm = async () => {
    if (!canManage) {
      setOpen(false)
      return
    }

    setPending(true)
    try {
      const method = isBanned ? "DELETE" : "POST"
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method,
        cache: "no-store",
        credentials: "include",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update status")
      }

      toast({
        title: isBanned ? "User reinstated" : "User banned",
        description: username ? `${username} has been ${isBanned ? "unbanned" : "banned"}.` : undefined,
      })
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle ban", error)
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to update user",
        variant: "destructive",
      })
    } finally {
      setPending(false)
      setOpen(false)
    }
  }

  const Icon = isBanned ? Check : Ban

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={!canManage}
          className={cn(
            "h-9 w-9 rounded-full shadow-sm transition-colors",
            tone.iconButton,
            !canManage && "cursor-not-allowed opacity-40",
          )}
          title={canManage ? `${actionLabel} user` : "Only reader and writer accounts can be managed"}
        >
          <Icon className={cn("h-4 w-4", tone.icon)} />
        </Button>
      </AlertDialogTrigger>
  <AlertDialogContent className="rounded-3xl border border-border bg-white text-foreground shadow-2xl dark:bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>{isBanned ? "Unban this user?" : "Ban this user?"}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {isBanned
              ? "This user will regain access to the platform."
              : "This user will immediately lose access to their account."}
            {username ? ` (${username})` : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-foreground shadow-sm dark:border-amber-300 dark:bg-white dark:text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">{tone.warningTitle}</p>
            <p className="text-sm">{tone.warningBody}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className={cn(
              "rounded-full px-4 py-2 font-semibold shadow-sm transition-colors",
              tone.actionButton,
              pending && "opacity-80",
            )}
          >
            {pending ? "Processing..." : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
