import type { RowDataPacket } from "mysql2/promise"
import { execute, query, queryOne } from "../db"
import type { UserRole } from "@/lib/types/database"

export interface UserRow extends RowDataPacket {
  user_id: number
  username: string
  email: string
  password: string | null
  profile_picture: string | null
  bio: string | null
  role: string
  created_at: Date
}

export interface CreateUserInput {
  username: string
  email: string
  password: string
  role?: UserRole
  profile_picture?: string | null
  bio?: string | null
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = ? LIMIT 1", [email])
}

export async function findUserById(userId: number): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE user_id = ? LIMIT 1", [userId])
}

export async function findUserByUsernameOrEmail(identifier: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1", [identifier, identifier])
}

export async function findUserByEmailOrUsername(email: string, username: string): Promise<UserRow | null> {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1", [email, username])
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const role = (input.role ?? "reader").toUpperCase()
  const result = await execute(
    `INSERT INTO users (username, email, password, role, profile_picture, bio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.username, input.email, input.password, role, input.profile_picture ?? null, input.bio ?? null],
  )

  const created = await findUserById(Number(result.insertId))
  if (!created) {
    throw new Error("Failed to load user after insert")
  }
  return created
}

export async function updateUserProfile(userId: number, data: Partial<Pick<UserRow, "username" | "bio" | "profile_picture">>): Promise<UserRow | null> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (typeof data.username === "string") {
    fields.push("username = ?")
    values.push(data.username)
  }

  if (typeof data.bio !== "undefined") {
    fields.push("bio = ?")
    values.push(data.bio)
  }

  if (typeof data.profile_picture !== "undefined") {
    fields.push("profile_picture = ?")
    values.push(data.profile_picture)
  }

  if (fields.length === 0) {
    return findUserById(userId)
  }

  values.push(userId)

  await execute(`UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`, values)
  return findUserById(userId)
}

export async function listUsers(limit = 50): Promise<UserRow[]> {
  return query<UserRow[]>("SELECT user_id, username, email, role, created_at, profile_picture FROM users ORDER BY created_at DESC LIMIT ?", [limit])
}

export async function countUsers(): Promise<number> {
  const row = await queryOne<RowDataPacket>("SELECT COUNT(*) as total FROM users")
  return row ? Number(row.total) : 0
}

export async function updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
  await execute("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId])
}

export async function updateUserRole(userId: number, role: UserRole): Promise<UserRow | null> {
  await execute("UPDATE users SET role = ? WHERE user_id = ?", [role.toUpperCase(), userId])
  return findUserById(userId)
}
