import { google, sheets_v4 } from "googleapis"

type AppendRowParams = {
  spreadsheetId: string
  range: string
  values: (string | number | null)[]
}

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null

async function createSheetsClient(): Promise<sheets_v4.Sheets> {
  const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN

  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
    oauth2.setCredentials({ refresh_token: refreshToken })
    return google.sheets({ version: "v4", auth: oauth2 })
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json",
    scopes: SHEETS_SCOPES,
  })

  const authClient = await auth.getClient()
  return google.sheets({ version: "v4", auth: authClient as any })
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (!sheetsClientPromise) {
    sheetsClientPromise = createSheetsClient()
  }

  return sheetsClientPromise
}

export async function appendRowToSheet({ spreadsheetId, range, values }: AppendRowParams): Promise<void> {
  if (!spreadsheetId) {
    throw new Error("Spreadsheet id is required to append rows")
  }

  const sheetsClient = await getSheetsClient()

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values.map((value) => (value == null ? "" : value))],
    },
  })
}

function toIsoTimestamp(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

interface RecordUserParams {
  id: number | string
  username: string
  email: string
  role: string
  createdAt?: Date | string | null
}

export async function recordUserCreationToSheet(entry: RecordUserParams): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_USERS_SPREADSHEET_ID
  if (!spreadsheetId) {
    return
  }

  const range = process.env.GOOGLE_SHEETS_USERS_RANGE ?? "Users!A:E"
  const createdAt = toIsoTimestamp(entry.createdAt)

  try {
    await appendRowToSheet({
      spreadsheetId,
      range,
      values: [entry.id, entry.username, entry.email, entry.role, createdAt],
    })
  } catch (error) {
    console.error("Failed to append user to Google Sheet:", error)
  }
}
