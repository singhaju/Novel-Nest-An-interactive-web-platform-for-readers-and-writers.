import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const DRIVE_FILE_ID_REGEXES = [
  /[?&]id=([a-zA-Z0-9_-]+)/, // Standard query param share links
  /\/d\/([a-zA-Z0-9_-]+)/, // /d/<id>/ style links
  /uc\?export=[^&]+&id=([a-zA-Z0-9_-]+)/, // uc export links
  /\/open\?id=([a-zA-Z0-9_-]+)/, // legacy open links
  /\/thumbnail\?id=([a-zA-Z0-9_-]+)/, // thumbnail endpoint
  /\/d\/([a-zA-Z0-9_-]+)=/, // googleusercontent direct links with sizing params
  /\/api\/uploads\/avatar\/([a-zA-Z0-9_-]+)/, // internal avatar proxy
  /\/api\/uploads\/covers\/([a-zA-Z0-9_-]+)/, // internal cover proxy
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractDriveFileIdFromUrl(value?: string | null): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return value
  }

  for (const regex of DRIVE_FILE_ID_REGEXES) {
    const match = value.match(regex)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

type DriveProxySegment = "avatar" | "covers"

function buildDriveProxyUrl(fileId: string, segment: DriveProxySegment): string {
  return `/api/uploads/${segment}/${encodeURIComponent(fileId)}`
}

function normalizeDriveAssetUrl(value: string | null | undefined, segment: DriveProxySegment): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined
  }

  const prefix = `/api/uploads/${segment}/`
  if (value.startsWith(prefix)) {
    return value
  }

  const fileId = extractDriveFileIdFromUrl(value)
  if (fileId) {
    return buildDriveProxyUrl(fileId, segment)
  }

  return value
}

export function normalizeProfileImageUrl(value?: string | null): string | undefined {
  return normalizeDriveAssetUrl(value, "avatar")
}

export function normalizeCoverImageUrl(value?: string | null): string | undefined {
  return normalizeDriveAssetUrl(value, "covers")
}

export function buildAvatarProxyUrl(fileId: string): string {
  return buildDriveProxyUrl(fileId, "avatar")
}

export function buildCoverProxyUrl(fileId: string): string {
  return buildDriveProxyUrl(fileId, "covers")
}
