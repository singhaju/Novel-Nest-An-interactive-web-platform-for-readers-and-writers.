"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import { cn, normalizeCoverImageUrl } from "@/lib/utils"

type Suggestion = {
  id: string
  title: string
  summary?: string
  cover_url?: string
  author?: {
    username?: string
  }
}

interface SearchBarProps {
  initialQuery?: string
  className?: string
}

export function SearchBar({ initialQuery, className }: SearchBarProps) {
  const MIN_QUERY_LENGTH = 1
  const router = useRouter()
  const [value, setValue] = useState(initialQuery ?? "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const latestQueryRef = useRef<string>("")
  const trimmedValue = value.trim()

  useEffect(() => {
    setValue(initialQuery ?? "")
  }, [initialQuery])

  useEffect(() => {
    const query = value.trim()
    if (!query) {
      setSuggestions([])
      setIsLoading(false)
      setOpen(false)
      latestQueryRef.current = ""
      return
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setIsLoading(false)
      latestQueryRef.current = query
      setOpen(true)
      return
    }

    setIsLoading(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: "6", status: "ongoing,completed", scope: "suggest" })
        const response = await fetch(`/api/novels?${params.toString()}`, { signal: controller.signal })

        if (!response.ok) {
          throw new Error("Search request failed")
        }

        const data = await response.json()
        const novels: Suggestion[] = Array.isArray(data?.novels) ? data.novels : []

        latestQueryRef.current = query
        setSuggestions(novels)
        setOpen(true)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Search request error", error)
        }
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const hasResults = suggestions.length > 0

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = trimmedValue
    setOpen(false)

    if (query.length === 0) {
      router.push("/novels")
      return
    }

    router.push(`/novels?q=${encodeURIComponent(query)}`)
  }

  const shouldShowEmptyState =
    !isLoading && open && latestQueryRef.current.length >= MIN_QUERY_LENGTH && !hasResults

  return (
    <div ref={containerRef} className={cn("relative flex-1 max-w-2xl", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          placeholder="Search novels..."
          aria-label="Search novels"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
          }}
          onFocus={() => {
            if (trimmedValue.length === 0) {
              return
            }
            if (suggestions.length > 0) {
              setOpen(true)
            }
          }}
          className="w-full rounded-full bg-muted px-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {open && (isLoading || hasResults || shouldShowEmptyState) ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          {isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Searching…</div>
          ) : hasResults ? (
            <ul className="divide-y divide-border">
              {suggestions.map((novel) => {
                const coverSrc = normalizeCoverImageUrl(novel.cover_url)
                return (
                <li key={novel.id}>
                  <Link
                    href={`/novel/${novel.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/70"
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={novel.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{novel.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {novel.author?.username ? `by ${novel.author.username}` : novel.summary || "View novel"}
                      </p>
                    </div>
                  </Link>
                </li>
                )
              })}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const query = trimmedValue
                    setOpen(false)
                    router.push(query ? `/novels?q=${encodeURIComponent(query)}` : "/novels")
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-primary hover:bg-muted/70"
                >
                  View all results
                  <span className="text-xs text-muted-foreground">↵ Enter</span>
                </button>
              </li>
            </ul>
          ) : shouldShowEmptyState ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">No novels found. Try another title or author.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
