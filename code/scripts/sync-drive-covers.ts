import "dotenv/config"

import { listFilesInFolder } from "../lib/google-drive.ts"
import { listNovelsForCoverSync, updateNovel } from "../lib/repositories/novels.ts"
import { extractDriveFileIdFromUrl } from "../lib/utils.ts"

function normalizeName(input: string | null | undefined): string {
  return (input ?? "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "")
}

async function main() {
  const apply = process.argv.includes("--apply")
  const folderId = process.env.GOOGLE_DRIVE_COVERS_FOLDER_ID

  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_COVERS_FOLDER_ID is not set")
  }

  console.log(`📁 Using Drive folder ${folderId}`)

  const [files, novels] = await Promise.all([listFilesInFolder(folderId), listNovelsForCoverSync()])

  if (!files.length) {
    console.warn("No files found in Drive folder. Upload covers first.")
    return
  }

  console.log(`Found ${files.length} cover candidates and ${novels.length} novels.`)

  let updated = 0

  for (const novel of novels) {
    const targetName = normalizeName(novel.title)
    if (!targetName) {
      console.warn(`⚠️ Novel ${novel.novel_id} has empty title, skipping.`)
      continue
    }

    const existingId = extractDriveFileIdFromUrl(novel.cover_image)
    if (existingId && files.some((file) => file.id === existingId)) {
      console.log(`✔ Novel ${novel.novel_id} already points to ${existingId}`)
      continue
    }

    const candidate = files.find((file) => {
      const fileName = normalizeName(file.name)
      return fileName.includes(targetName) || targetName.includes(fileName)
    })

    if (!candidate) {
      console.warn(`❌ No Drive file matches title "${novel.title}" (id ${novel.novel_id}).`)
      continue
    }

    const newUrl = `https://drive.google.com/uc?id=${candidate.id}`
    console.log(`➡ Novel ${novel.novel_id} → ${novel.title}`)
    console.log(`   using file ${candidate.name} (${candidate.id})`)

    if (apply) {
      await updateNovel(novel.novel_id, { cover_image: newUrl })
      updated += 1
    }
  }

  if (apply) {
    console.log(`✅ Updated ${updated} novels.`)
  } else {
    console.log("Dry run complete. Rerun with --apply to persist changes.")
  }
}

main().catch((error) => {
  console.error("Failed to sync cover images:", error)
  process.exitCode = 1
})
