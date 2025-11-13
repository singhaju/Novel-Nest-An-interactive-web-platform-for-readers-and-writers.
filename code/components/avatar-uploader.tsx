"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"

type Props = {
  initialSrc?: string | null
  username?: string | null
}

export default function AvatarUploader({ initialSrc, username }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [src, setSrc] = useState<string | undefined | null>(initialSrc ?? undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChoose = () => {
    inputRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic client-side validation (optional)
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      // Preview immediately
      setSrc(dataUrl)

      try {
        setLoading(true)

        // First upload to our server route which will push the file to Google Drive
        const uploadRes = await fetch('/api/uploads/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        })

        if (!uploadRes.ok) {
          const j = await uploadRes.json().catch(() => ({}))
          throw new Error(j.error || `Upload failed (${uploadRes.status})`)
        }

        const uploadJson = await uploadRes.json()
        const driveUrl = uploadJson.url

        if (!driveUrl) {
          throw new Error('No URL returned from upload')
        }

        // Persist the Drive URL as the user's profile picture
        const res = await fetch('/api/users/me/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_picture: driveUrl }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || `Failed to save profile (${res.status})`)
        }
      } catch (err: any) {
        console.error(err)
        setError(err?.message || 'Failed to upload image')
      } finally {
        setLoading(false)
      }
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="relative w-48 h-48">
  <div className="relative aspect-square w-full h-full overflow-hidden rounded-full bg-linear-to-br from-blue-100 to-green-100">
        {src ? (
          // use next/image to take advantage of optimization where possible
          // fall back to simple img if src is a data URL (Next handles data URLs too)
          <Image src={src} alt={username ?? "User"} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-4">
              <p className="text-4xl font-bold text-foreground">Profile</p>
              <p className="text-xl text-muted-foreground">Picture</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {/* Small green + button overlay (bottom-right) */}
      <button
        type="button"
        onClick={onChoose}
        className="absolute right-0 bottom-0 -translate-y-2 translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg border-2 border-white hover:bg-green-600 transition-colors"
        aria-label="Change profile picture"
        title="Change profile picture"
      >
        <span className="text-xl font-bold">+</span>
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
          <div className="text-white">Uploading…</div>
        </div>
      )}

      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  )
}
