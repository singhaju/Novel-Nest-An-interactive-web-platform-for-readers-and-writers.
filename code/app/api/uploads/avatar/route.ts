import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { uploadToGoogleDrive } from '@/lib/google-drive'

// Fallback folder ID from the user-provided link. You can also set
// process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID to override.
const DEFAULT_FOLDER_ID = process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID || '1zwkV2zevwIM4TsVyghUYDe_AVeT0vjgu'

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

    const url = await uploadToGoogleDrive({ fileName: name, mimeType, fileContent: buffer, folderId: DEFAULT_FOLDER_ID })

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
