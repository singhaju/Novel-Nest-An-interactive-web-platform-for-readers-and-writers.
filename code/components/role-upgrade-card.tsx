"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"

import { upgradeToWriter } from "@/lib/actions/roles"
import { Button } from "@/components/ui/button"

interface RoleUpgradeCardProps {
  currentRole: string
}

export function RoleUpgradeCard({ currentRole }: RoleUpgradeCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const readableRole = useMemo(() => {
    if (!currentRole) return "Guest"
    return currentRole.charAt(0).toUpperCase() + currentRole.slice(1)
  }, [currentRole])

  const canUpgrade = currentRole === "reader"

  function handleUpgrade() {
    if (!canUpgrade) return

    startTransition(async () => {
      try {
        await upgradeToWriter()
      } finally {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6 rounded-3xl border border-dashed border-border bg-card/60 p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Mode</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{readableRole}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Readers can browse, like, and follow stories. Writers unlock the author dashboard, publishing tools, and novel
          analytics — all within the same account.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1 rounded-2xl" disabled>
          Reader Mode
        </Button>
        <Button
          type="button"
          className="flex-1 rounded-2xl"
          onClick={handleUpgrade}
          disabled={!canUpgrade || isPending}
        >
          {isPending ? "Switching…" : "Switch to Writer"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Switching is instant and reversible. You can continue reading after publishing without losing any data.
      </p>
    </div>
  )
}
