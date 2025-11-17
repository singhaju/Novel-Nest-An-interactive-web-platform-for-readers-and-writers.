import { NextRequest, NextResponse } from "next/server"
import { Readable } from "node:stream"

import { downloadDriveFile } from "@/lib/google-drive"
import { extractDriveFileIdFromUrl } from "@/lib/utils"

export const runtime = "nodejs"

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, immutable",
}

type CoverParams = { fileId?: string }
type MaybePromise<T> = T | Promise<T>

async function unwrapParams(possible: MaybePromise<CoverParams> | null | undefined): Promise<CoverParams> {
  if (!possible) {
    return {}
  }

  if (typeof (possible as Promise<CoverParams>).then === "function") {
    return possible as Promise<CoverParams>
  }

  return possible as CoverParams
}

function extractFileIdFromPath(request: NextRequest): string | undefined {
  const url = new URL(request.url)
  const segments = url.pathname.split("/").filter(Boolean)
  return segments.at(-1)
}

export async function GET(request: NextRequest, context: { params?: MaybePromise<CoverParams> }) {
  const resolvedParams = await unwrapParams(context?.params)
  const rawParam = resolvedParams.fileId ?? extractFileIdFromPath(request)
  const decoded = typeof rawParam === "string" ? decodeURIComponent(rawParam) : ""
  const driveFileId = extractDriveFileIdFromUrl(decoded) ?? decoded

  if (!driveFileId) {
    console.warn("Cover proxy: missing file id", { rawParam })
    return NextResponse.json({ error: "Missing file id" }, { status: 400 })
  }

  try {
    const { stream, mimeType } = await downloadDriveFile(driveFileId)
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream

    return new NextResponse(webStream, {
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
