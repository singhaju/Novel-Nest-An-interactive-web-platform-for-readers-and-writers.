import { drive_v3, google } from "googleapis"
import { Readable } from "node:stream"

import { extractDriveFileIdFromUrl } from "./utils"

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

export const DEFAULT_AVATAR_FOLDER_ID = process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID || "1zwkV2zevwIM4TsVyghUYDe_AVeT0vjgu"
export const DEFAULT_COVER_FOLDER_ID = process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID || DEFAULT_AVATAR_FOLDER_ID

let driveClientPromise: Promise<drive_v3.Drive> | null = null

async function createDriveClient(): Promise<drive_v3.Drive> {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN

  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
    oauth2.setCredentials({ refresh_token: refreshToken })
    return google.drive({ version: "v3", auth: oauth2 })
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json",
    scopes: DRIVE_SCOPES,
  })

  const authClient = await auth.getClient()
  return google.drive({ version: "v3", auth: authClient as any })
}

async function getDriveClient(): Promise<drive_v3.Drive> {
  if (!driveClientPromise) {
    driveClientPromise = createDriveClient()
  }

  return driveClientPromise
}

export interface UploadFileOptions {
  fileName: string
  mimeType: string
  fileContent: Buffer | string
  folderId?: string
}

/**
 * Upload a file to Google Drive
 */
export async function uploadToGoogleDrive(options: UploadFileOptions): Promise<string> {
  const { fileName, mimeType, fileContent, folderId } = options

  try {
    const drive = await getDriveClient()
    const fileMetadata: any = {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    }

    const contentBuffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent)
    const media = {
      mimeType,
      body: Readable.from(contentBuffer),
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    })

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    const fileId = response.data.id

    if (!fileId) {
      throw new Error("Google Drive did not return a file id")
    }

    // Use the Googleusercontent CDN link which serves the raw binary without ORB blocking.
    return `https://lh3.googleusercontent.com/d/${fileId}`
  } catch (error: any) {
    const apiMessage = error?.response?.data?.error?.message
    const message = apiMessage || error?.message || "Failed to upload file to Google Drive"
    console.error("Error uploading to Google Drive:", apiMessage || error)
    throw new Error(`Failed to upload file to Google Drive: ${message}`)
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGoogleDrive(fileUrl: string): Promise<void> {
  try {
    const drive = await getDriveClient()
    const fileId = extractDriveFileIdFromUrl(fileUrl)
    if (!fileId) {
      throw new Error("Invalid Google Drive URL")
    }

    await drive.files.delete({ fileId })
  } catch (error) {
    console.error("Error deleting from Google Drive:", error)
    throw new Error("Failed to delete file from Google Drive")
  }
}

/**
 * Get file content from Google Drive
 */
export async function getFileFromGoogleDrive(fileUrl: string): Promise<string> {
  try {
    const drive = await getDriveClient()
    const fileId = extractDriveFileIdFromUrl(fileUrl)
    if (!fileId) {
      throw new Error("Invalid Google Drive URL")
    }

    const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" })

    return response.data as string
  } catch (error) {
    console.error("Error fetching from Google Drive:", error)
    throw new Error("Failed to fetch file from Google Drive")
  }
}

export interface DriveFileSummary {
  id: string
  name: string
  mimeType?: string
  modifiedTime?: string
}

export async function listFilesInFolder(folderId: string): Promise<DriveFileSummary[]> {
  const drive = await getDriveClient()
  const files: DriveFileSummary[] = []
  let pageToken: string | undefined

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
      spaces: "drive",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: "allDrives",
    })

    const batch = response.data.files ?? []
    for (const file of batch) {
      if (!file.id || !file.name) continue
      files.push({ id: file.id, name: file.name, mimeType: file.mimeType ?? undefined, modifiedTime: file.modifiedTime ?? undefined })
    }

    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return files
}

export async function downloadDriveFile(fileId: string): Promise<{ stream: Readable; mimeType: string | undefined }> {
  const drive = await getDriveClient()
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" })

  const mimeType = response.headers["content-type"] as string | undefined
  const stream = response.data as unknown as Readable

  return { stream, mimeType }
}
