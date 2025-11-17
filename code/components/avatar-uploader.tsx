"use client"

import React, { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import { normalizeProfileImageUrl } from "@/lib/utils"

type Props = {
  initialSrc?: string | null
  username?: string | null
}

export default function AvatarUploader({ initialSrc, username }: Props) {
  const { data: session, update: refreshSession } = useSession()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [src, setSrc] = useState<string | undefined | null>(normalizeProfileImageUrl(initialSrc))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof initialSrc === "string" && initialSrc.length > 0) {
      setSrc(normalizeProfileImageUrl(initialSrc))
      return
    }

    if (!initialSrc) {
      setSrc((prev) => (prev ? prev : undefined))
    }
  }, [initialSrc])

  useEffect(() => {
    const sessionSrc = session?.user?.profile_picture
    if (typeof sessionSrc === "string" && sessionSrc.length > 0) {
      setSrc(normalizeProfileImageUrl(sessionSrc))
    }
  }, [session?.user?.profile_picture])

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
        console.debug("AvatarUploader: upload response", uploadJson)
        const normalizedUploadUrl =
          normalizeProfileImageUrl(uploadJson.url ?? uploadJson.rawUrl) ?? uploadJson.url ?? uploadJson.rawUrl

        if (!normalizedUploadUrl) {
          throw new Error('No URL returned from upload')
        }

        // Persist the Drive URL as the user's profile picture
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: normalizedUploadUrl }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || `Failed to save profile (${res.status})`)
        }

        const json = (await res.json().catch(() => ({}))) as { profilePicture?: string | null }
        console.debug("AvatarUploader: profile update response", json)
        const finalUrl =
          normalizeProfileImageUrl(json?.profilePicture ?? normalizedUploadUrl) ?? normalizedUploadUrl
        setSrc(finalUrl)
  await refreshSession?.()
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
          <img src={src} alt={username ?? "User"} className="h-full w-full object-cover" />
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
