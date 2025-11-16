import mysql, { type Pool, type PoolConnection, type PoolOptions, type ResultSetHeader, type RowDataPacket } from "mysql2/promise"

export type QueryValue = string | number | boolean | Date | Buffer | null
export type QueryValues = QueryValue[]

let pool: Pool | null = null

function ensureDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not defined. Please configure your MySQL connection string.")
  }
  return url
}

function buildPool(): Pool {
  const databaseUrl = ensureDatabaseUrl()
  const parsed = new URL(databaseUrl)

  const config: PoolOptions = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE ?? "10"),
    queueLimit: 0,
    namedPlaceholders: false,
    multipleStatements: false,
  }

  const sslMode = parsed.searchParams.get("sslmode") ?? process.env.DB_SSL
  if (sslMode && ["require", "true", "1"].includes(sslMode.toLowerCase())) {
    config.ssl = {
      rejectUnauthorized: false,
    }
  }

  pool = mysql.createPool(config)
  return pool
}

export function getPool(): Pool {
  if (pool) {
    return pool
  }
  return buildPool()
}

export async function query<T extends RowDataPacket[]>(sql: string, params: QueryValues = []): Promise<T> {
  const activePool = getPool()
  const [rows] = await activePool.query<RowDataPacket[]>(sql, params)
  return rows as T
}

export async function queryOne<T extends RowDataPacket>(sql: string, params: QueryValues = []): Promise<T | null> {
  const rows = await query<T[]>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params: QueryValues = []): Promise<ResultSetHeader> {
  const activePool = getPool()
  const [result] = await activePool.execute<ResultSetHeader>(sql, params)
  return result
}

export async function transaction<T>(handler: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const activePool = getPool()
  const connection = await activePool.getConnection()

  try {
    await connection.beginTransaction()
    const result = await handler(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function withConnection<T>(handler: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const activePool = getPool()
  const connection = await activePool.getConnection()
  try {
    return await handler(connection)
  } finally {
    connection.release()
  }
}
