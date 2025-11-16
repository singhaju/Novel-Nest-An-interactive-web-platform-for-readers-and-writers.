import { createHash, randomBytes, timingSafeEqual } from "crypto"
import bcrypt from "bcryptjs"

const PEPPER = process.env.PASSWORD_PEPPER ?? process.env.NEXTAUTH_SECRET ?? "novel-nest-pepper"
const SALT_SIZE_BYTES = Number(process.env.PASSWORD_SALT_BYTES ?? "16")

export function hashPassword(password: string, existingSalt?: string): string {
  if (!password) {
    throw new Error("Cannot hash an empty password")
  }
  const salt = existingSalt ?? randomBytes(SALT_SIZE_BYTES).toString("hex")
  const digest = createHash("sha256").update(`${salt}:${password}:${PEPPER}`).digest("hex")
  return `${salt}:${digest}`
}

export function isSha256Hash(hash: string | null | undefined): boolean {
  if (!hash) return false
  return hash.includes(":") && hash.split(":").every((chunk) => chunk.length >= 32)
}

export async function verifyPassword(password: string, storedHash: string): Promise<{ valid: boolean; needsMigration: boolean }> {
  if (!storedHash) {
    return { valid: false, needsMigration: false }
  }

  if (isSha256Hash(storedHash)) {
    const [salt, digest] = storedHash.split(":")
    if (!salt || !digest) {
      return { valid: false, needsMigration: false }
    }
    const computed = createHash("sha256").update(`${salt}:${password}:${PEPPER}`).digest("hex")
    if (computed.length !== digest.length) {
      return { valid: false, needsMigration: false }
    }
    const valid = timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(digest, "hex"))
    return { valid, needsMigration: false }
  }

  // Backwards compatibility with legacy bcrypt hashes
  if (storedHash.startsWith("$2")) {
    const valid = await bcrypt.compare(password, storedHash)
    return { valid, needsMigration: valid }
  }

  return { valid: false, needsMigration: false }
}
