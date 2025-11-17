import "dotenv/config"

import { getPool } from "../lib/db"
import { listNovelsForCoverSync } from "../lib/repositories/novels"
import { extractDriveFileIdFromUrl, normalizeCoverImageUrl } from "../lib/utils"

function describeCover(value: string | null): { fileId?: string; proxyUrl?: string } {
  if (!value) {
    return {}
  }

  const fileId = extractDriveFileIdFromUrl(value)
  const proxyUrl = normalizeCoverImageUrl(value) ?? undefined

  return { fileId: fileId ?? undefined, proxyUrl }
}

async function main() {
  const rows = await listNovelsForCoverSync()

  if (!rows.length) {
    console.log("No novels found.")
    return
  }

  for (const row of rows) {
    const { fileId, proxyUrl } = describeCover(row.cover_image)
    console.log(`Novel ${row.novel_id} - ${row.title}`)
    console.log(`  raw cover: ${row.cover_image ?? "<null>"}`)
    console.log(`  file id : ${fileId ?? "<missing>"}`)
    console.log(`  proxy   : ${proxyUrl ?? "<missing>"}`)
  }
}

main()
  .catch((error) => {
    console.error("Failed to inspect covers:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    const pool = getPool()
    await pool.end()
  })
