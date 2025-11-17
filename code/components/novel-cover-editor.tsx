"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

interface NovelCoverEditorProps {
  novelId: number
  initialCoverUrl?: string | null
  title: string
}

export function NovelCoverEditor({ novelId, initialCoverUrl, title }: NovelCoverEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [currentCover, setCurrentCover] = useState<string | null>(initialCoverUrl ?? null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    setCurrentCover(initialCoverUrl ?? null)
  }, [initialCoverUrl])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const displayImage = useMemo(() => previewUrl ?? currentCover, [previewUrl, currentCover])

  const handleFilePick = () => {
    setError(null)
    setShowSaved(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file")
      event.currentTarget.value = ""
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
    setShowSaved(false)
  }

  const resetSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("coverImage", selectedFile)

      const response = await fetch(`/api/novels/${novelId}`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update cover")
      }

      setShowSaved(true)
      resetSelection()
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update cover")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    setError(null)
    setShowSaved(false)

    try {
      const formData = new FormData()
      formData.append("removeCover", "true")

      const response = await fetch(`/api/novels/${novelId}`, {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to remove cover")
      }

      setCurrentCover(null)
      resetSelection()
      setShowSaved(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to remove cover")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-48 w-36 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={`${title} cover`}
              width={240}
              height={320}
              className="h-full w-full object-cover"
              priority={false}
            />
          ) : (
            <span className="text-xs text-muted-foreground">No cover uploaded</span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={handleFilePick} className="rounded-2xl" disabled={uploading}>
            Choose image
          </Button>
          {currentCover && !previewUrl && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={handleRemove}
              disabled={uploading}
            >
              Remove cover
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <p className="text-center text-xs text-muted-foreground">
          Recommended size 600×900px. JPG or PNG under 5&nbsp;MB.
        </p>
      </div>

      <div className="flex-1 space-y-3">
        {selectedFile && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleUpload} disabled={uploading} className="rounded-2xl">
              {uploading ? "Uploading..." : "Save cover"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetSelection} disabled={uploading}>
              Cancel
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </span>
          </div>
        )}

        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {showSaved && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Cover updated</div>}

        <p className="text-sm text-muted-foreground">
          Uploading a new image replaces the existing cover immediately after saving.
        </p>
      </div>
    </div>
  )
}
