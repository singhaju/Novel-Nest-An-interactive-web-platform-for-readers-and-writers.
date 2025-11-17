#!/usr/bin/env node

import { google } from "googleapis"
import http from "node:http"
import { randomInt } from "node:crypto"
import { spawn } from "node:child_process"
import process from "node:process"

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const value = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i]
      result[key] = value
    }
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
const clientId = args["client-id"] || process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID
const clientSecret = args["client-secret"] || process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET
const scope = args.scope || "https://www.googleapis.com/auth/drive"

if (!clientId || !clientSecret) {
  console.error("Missing client ID or client secret. Pass them with --client-id and --client-secret or set the GOOGLE_DRIVE_OAUTH_CLIENT_ID / GOOGLE_DRIVE_OAUTH_CLIENT_SECRET env vars.")
  process.exit(1)
}

const port = Number.parseInt(args.port, 10) || randomInt(4000, 65000)
const redirectUri = `http://localhost:${port}`

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: [scope],
  prompt: "consent",
  response_type: "code",
})

console.log("\n1. Opening browser for Google consent...")
console.log(`   If it does not open automatically, visit:\n   ${authUrl}\n`)

try {
  const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"
  spawn(opener, [authUrl], { stdio: "ignore", shell: true })
} catch (error) {
  console.warn("Could not auto-open browser:", error.message)
}

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    if (!req.url?.startsWith("/")) {
      res.writeHead(404)
      res.end()
      return
    }

    const url = new URL(req.url, `${redirectUri}/`)
    const authCode = url.searchParams.get("code")
    const authError = url.searchParams.get("error")

    res.writeHead(200, { "Content-Type": "text/html" })

    if (authError) {
      res.end(`<h1>OAuth Error</h1><p>${authError}</p><p>You can close this window.</p>`)
      reject(new Error(`OAuth error: ${authError}`))
      server.close()
      return
    }

    if (!authCode) {
      res.end("<h1>No code received</h1><p>You can close this window.</p>")
      reject(new Error("No authorization code received"))
      server.close()
      return
    }

  res.end("<h1>Authorization complete</h1><p>You can close this window and return to the terminal.</p>")
    resolve(authCode)
    server.close()
  })

  server.listen(port, () => {
    console.log(`2. After granting access, Google will redirect to http://localhost:${port}/oauth2callback and this tool will grab the code automatically.`)
  })
})

const { tokens } = await oauth2Client.getToken(code)

if (!tokens.refresh_token) {
  console.error("No refresh token returned. Ensure you used --prompt consent and that this is the first time authorizing with this client.")
  process.exit(1)
}

console.log("\nSuccess! Add these to your .env:\n")
console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_ID="${clientId}"`)
console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_SECRET="${clientSecret}"`)
console.log(`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`)

console.log("\nKeep the refresh token secret. You can now stop this script.\n")
