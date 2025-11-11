#!/usr/bin/env node

/**
 * Novel Nest Database Seed Script
 * Runs the seed_novels.sql file to populate the database with sample data
 * 
 * Usage: npm run seed
 * or: node scripts/seed.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runSeed() {
  let connection

  try {
    console.log('🌱 Starting Novel Nest database seed...')

    // Parse DATABASE_URL from .env
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not found in .env')
    }

    // Parse MySQL connection string
    // Format: mysql://username:password@host:port/database
    const url = new URL(databaseUrl)
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      multipleStatements: true,
    }

    console.log(`📡 Connecting to MySQL database: ${config.database} at ${config.host}:${config.port}`)

    // Create connection pool
    connection = await mysql.createConnection(config)

    console.log('✅ Connected to database successfully!')

    // Read the seed SQL file
    const seedFilePath = path.join(__dirname, 'seed_novels.sql')
    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Seed file not found at ${seedFilePath}`)
    }

    const seedSql = fs.readFileSync(seedFilePath, 'utf8')
    console.log('📖 Seed file loaded')

    // Execute the seed script
    console.log('⏳ Executing seed script...')
    const results = await connection.query(seedSql)

    console.log('\n✨ Seed script executed successfully!')
    console.log('\n📊 Data Summary:')
    console.log('  • 7 Users (5 Authors, 2 Readers)')
    console.log('  • 5 Novels')
    console.log('  • 10 Episodes (2 per novel)')
    console.log('  • 10 Reviews')
    console.log('  • 10 Comments')
    console.log('  • 4 Follow Relationships')
    console.log('  • 4 Wishlist Items')
    console.log('  • 4 Reading Progress Entries')

    console.log('\n🎉 Database seeding completed!')
    console.log('\n📝 Sample Credentials (for testing):')
    console.log('  Author: jane_austen@example.com / pass4jane')
    console.log('  Reader: reader22@example.com / password123')
  } catch (error) {
    console.error('\n❌ Error seeding database:')
    console.error(error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n✅ Database connection closed')
    }
  }
}

// Run the seed
runSeed()
