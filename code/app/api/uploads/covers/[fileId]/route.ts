import { NextRequest, NextResponse } from "next/server"
import { Readable } from "node:stream"

import { downloadDriveFile } from "@/lib/google-drive"
import { extractDriveFileIdFromUrl } from "@/lib/utils"

export const runtime = "nodejs"

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, immutable",
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ fileId?: string }> }) {
  const { fileId: rawParam } = await params
  const decoded = typeof rawParam === "string" ? decodeURIComponent(rawParam) : ""
  const driveFileId = extractDriveFileIdFromUrl(decoded) ?? decoded

  if (!driveFileId) {
    console.warn("Cover proxy: missing file id", { rawParam })
    return NextResponse.json({ error: "Missing file id" }, { status: 400 })
  }

  try {
    const { stream, mimeType } = await downloadDriveFile(driveFileId)
    const webStream = Readable.toWeb(stream)

    return new NextResponse(webStream as any, {
      headers: {
        "Content-Type": mimeType ?? "application/octet-stream",
        ...CACHE_HEADERS,
      },
    })
  } catch (error) {
    console.error("Cover proxy error:", { driveFileId, error })
    return NextResponse.json({ error: "Cover not found" }, { status: 404 })
  }
}
