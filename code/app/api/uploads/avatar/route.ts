import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_AVATAR_FOLDER_ID, uploadToGoogleDrive } from '@/lib/google-drive'
import { buildAvatarProxyUrl, extractDriveFileIdFromUrl } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dataUrl, fileName } = body

    if (!dataUrl) {
      return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 })
    }

    // dataUrl format: data:<mime>;base64,<data>
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid dataUrl' }, { status: 400 })
    }

    const mimeType = match[1]
    const base64Data = match[2]
    const buffer = Buffer.from(base64Data, 'base64')

    const name = fileName || `avatar-${Date.now()}`

    const rawUrl = await uploadToGoogleDrive({ fileName: name, mimeType, fileContent: buffer, folderId: DEFAULT_AVATAR_FOLDER_ID })
    const fileId = extractDriveFileIdFromUrl(rawUrl)
    const proxyUrl = fileId ? buildAvatarProxyUrl(fileId) : rawUrl

    return NextResponse.json({ url: proxyUrl, rawUrl, fileId })
  } catch (error: unknown) {
    console.error("Upload error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
