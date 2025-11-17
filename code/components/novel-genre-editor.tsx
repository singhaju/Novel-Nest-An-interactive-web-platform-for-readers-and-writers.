"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DEFAULT_VISIBLE_GENRE_COUNT, GENRE_OPTIONS } from "@/lib/genres"

function toggleSelection(current: string[], value: string, checked: boolean): string[] {
  if (checked) {
    return current.includes(value) ? current : [...current, value]
  }
  return current.filter((item) => item !== value)
}

function dedupeAndNormalize(values: string[]): string[] {
  const seen = new Set<string>()
  for (const value of values) {
    const normalized = value.trim()
    if (normalized.length > 0) {
      seen.add(normalized)
    }
  }
  return Array.from(seen)
}

interface NovelGenreEditorProps {
  novelId: number
  initialGenres: string[]
}

export function NovelGenreEditor({ novelId, initialGenres }: NovelGenreEditorProps) {
  const router = useRouter()

  const normalizedInitial = useMemo(() => dedupeAndNormalize(initialGenres), [initialGenres])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(normalizedInitial)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const availableGenres = useMemo(() => {
    const baseGenres = [...GENRE_OPTIONS] as string[]
    const extras = normalizedInitial.filter((genre) => !baseGenres.includes(genre))
    return [...baseGenres, ...extras]
  }, [normalizedInitial])

  const hasChanges = useMemo(() => {
    if (selectedGenres.length !== normalizedInitial.length) {
      return true
    }

    const sortedSelected = [...selectedGenres].sort()
    const sortedInitial = [...normalizedInitial].sort()
    return sortedSelected.some((value, index) => value !== sortedInitial[index])
  }, [normalizedInitial, selectedGenres])

  const handleSave = async () => {
    if (!selectedGenres.length) {
      setError("Please select at least one genre")
      return
    }

    setSaving(true)
    setError(null)
    setShowSaved(false)

    try {
      const response = await fetch(`/api/novels/${novelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: JSON.stringify(selectedGenres) }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update genres")
      }

      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2500)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update genres")
    } finally {
      setSaving(false)
    }
  }

  const visibleGenres = expanded ? availableGenres : availableGenres.slice(0, DEFAULT_VISIBLE_GENRE_COUNT)

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {visibleGenres.map((option) => {
          const checked = selectedGenres.includes(option)
          return (
            <label
              key={option}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:bg-muted"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) =>
                  setSelectedGenres((current) => toggleSelection(current, option, value === true))
                }
              />
              <span className="font-medium">{option}</span>
            </label>
          )
        })}
      </div>

      {availableGenres.length > DEFAULT_VISIBLE_GENRE_COUNT && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded((previous) => !previous)}
          className="rounded-2xl"
        >
          {expanded ? "Hide genres" : "View more genres"}
        </Button>
      )}

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {showSaved && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Genres updated</div>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="rounded-2xl">
          {saving ? "Saving..." : "Save genres"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!hasChanges}
          onClick={() => {
            setSelectedGenres(normalizedInitial)
            setError(null)
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
