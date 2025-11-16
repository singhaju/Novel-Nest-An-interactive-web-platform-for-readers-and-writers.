import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_COVER_FOLDER_ID, listFilesInFolder } from "@/lib/google-drive"
import { buildCoverProxyUrl, normalizeCoverImageUrl } from "@/lib/utils"
import { slugify } from "@/lib/tags"

const ALLOWED_ROLES = new Set(["admin", "developer", "superadmin"])

function deriveFileSlug(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, "")
  const normalized = withoutExtension.replace(/[-_\s]+/g, " ").trim()
  return slugify(normalized)
}

function deriveNovelSlug(title: string): string {
  return slugify(title)
}

export async function POST() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = typeof (session.user as any).role === "string" ? (session.user as any).role.toLowerCase() : "reader"
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const folderId = DEFAULT_COVER_FOLDER_ID
    const files = await listFilesInFolder(folderId)

    if (!files.length) {
      return NextResponse.json({ message: "No files found in the covers folder", updates: [] })
    }

    const fileBySlug = new Map<string, string>()
    for (const file of files) {
      const slug = deriveFileSlug(file.name)
      if (slug && !fileBySlug.has(slug)) {
        fileBySlug.set(slug, file.id)
      }
    }

    const novels = await prisma.novel.findMany({
      select: {
        novel_id: true,
        title: true,
        cover_image: true,
      },
    })

    const updates: Array<{ novelId: number; title: string; newUrl: string }> = []
    const missing: Array<{ novelId: number; title: string }> = []
    const skipped: Array<{ novelId: number; title: string; reason: string }> = []

    for (const novel of novels) {
      const slug = deriveNovelSlug(novel.title)
      const fileId = fileBySlug.get(slug)

      if (!fileId) {
        missing.push({ novelId: novel.novel_id, title: novel.title })
        continue
      }

      const nextUrl = buildCoverProxyUrl(fileId)
      const currentUrl = normalizeCoverImageUrl(novel.cover_image) ?? null

      if (currentUrl === nextUrl) {
        skipped.push({ novelId: novel.novel_id, title: novel.title, reason: "already up to date" })
        continue
      }

      await prisma.novel.update({
        where: { novel_id: novel.novel_id },
        data: { cover_image: nextUrl },
      })

      updates.push({ novelId: novel.novel_id, title: novel.title, newUrl: nextUrl })
    }

    return NextResponse.json({
      message: `Synced ${updates.length} covers`,
      updated: updates,
      skipped,
      missing,
    })
  } catch (error) {
    console.error("Sync covers error:", error)
    return NextResponse.json({ error: "Failed to sync novel covers" }, { status: 500 })
  }
}
