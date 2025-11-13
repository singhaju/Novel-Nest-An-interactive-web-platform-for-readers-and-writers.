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
import bcrypt from 'bcryptjs'

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

    // Ensure core demo users exist for each role
    const demoUsers = [
      {
        username: 'reader_demo',
        email: 'reader@novelnest.dev',
        role: 'READER',
        password: 'Read1234!',
        profile_picture: 'https://i.pravatar.cc/150?img=12',
        bio: 'Avid reader exploring every new release on Novel Nest.'
      },
      {
        username: 'writer_demo',
        email: 'writer@novelnest.dev',
        role: 'WRITER',
        password: 'Write1234!',
        profile_picture: 'https://i.pravatar.cc/150?img=32',
        bio: 'Indie author sharing serialized adventures every week.'
      },
      {
        username: 'admin_demo',
        email: 'admin@novelnest.dev',
        role: 'ADMIN',
        password: 'Admin1234!',
        profile_picture: 'https://i.pravatar.cc/150?img=55',
        bio: 'Platform administrator keeping the shelves safe and tidy.'
      },
      {
        username: 'developer_demo',
        email: 'developer@novelnest.dev',
        role: 'DEVELOPER',
        password: 'Dev1234!',
        profile_picture: 'https://i.pravatar.cc/150?img=68',
        bio: 'Maintains Novel Nest infrastructure and integrations.'
      }
    ]

    console.log('👥 Seeding core demo accounts...')
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10)
      await connection.execute(
        `INSERT INTO users (username, email, password, role, profile_picture, bio)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           password = VALUES(password),
           role = VALUES(role),
           profile_picture = VALUES(profile_picture),
           bio = VALUES(bio)`,
        [user.username, user.email, passwordHash, user.role, user.profile_picture, user.bio]
      )
    }

    // Attach a sample novel to the writer account if none exist
    const [writerRows] = await connection.execute('SELECT user_id FROM users WHERE email = ?', ['writer@novelnest.dev'])
    const writerId = writerRows?.[0]?.user_id
    if (writerId) {
      const novelTitle = 'Demo Writer Saga'
      const novelPayload = {
        description: 'A showcase series published by the demo author to help you explore the platform interface.',
        tags: JSON.stringify(['demo', 'getting-started', 'featured']),
        status: 'ONGOING',
        views: 1024,
        likes: 128,
        rating: 4.6,
      }

      const [existingNovelRows] = await connection.execute(
        'SELECT novel_id FROM novels WHERE author_id = ? AND title = ?',
        [writerId, novelTitle]
      )

      let writerNovelId
      if (existingNovelRows.length === 0) {
        const [insertResult] = await connection.execute(
          `INSERT INTO novels (title, description, tags, status, views, likes, rating, author_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            novelTitle,
            novelPayload.description,
            novelPayload.tags,
            novelPayload.status,
            novelPayload.views,
            novelPayload.likes,
            novelPayload.rating,
            writerId,
          ]
        )
        writerNovelId = insertResult.insertId
      } else {
        writerNovelId = existingNovelRows[0].novel_id
        await connection.execute(
          `UPDATE novels SET description = ?, tags = ?, status = ?, views = ?, likes = ?, rating = ? WHERE novel_id = ?`,
          [
            novelPayload.description,
            novelPayload.tags,
            novelPayload.status,
            novelPayload.views,
            novelPayload.likes,
            novelPayload.rating,
            writerNovelId,
          ]
        )
      }

      if (writerNovelId) {
        const demoEpisodes = [
          {
            title: 'Episode 1: Welcome to Novel Nest',
            content:
              'An introductory chapter that walks you through how to format, schedule, and publish your first serialized story on Novel Nest.',
          },
          {
            title: 'Episode 2: Draft to Publish Checklist',
            content:
              'A quick-reference checklist covering editing, cover upload, reader tags, and announcement tips before you hit publish.',
          },
        ]

        for (const episode of demoEpisodes) {
          const [existingEpisodeRows] = await connection.execute(
            'SELECT episode_id FROM episodes WHERE novel_id = ? AND title = ?',
            [writerNovelId, episode.title]
          )

          if (existingEpisodeRows.length === 0) {
            await connection.execute(
              `INSERT INTO episodes (novel_id, title, content)
               VALUES (?, ?, ?)`,
              [writerNovelId, episode.title, episode.content]
            )
          } else {
            await connection.execute(
              `UPDATE episodes SET content = ? WHERE episode_id = ?`,
              [episode.content, existingEpisodeRows[0].episode_id]
            )
          }
        }
      }
    }

    console.log('\n✨ Seed script executed successfully!')
  console.log('\n📊 Data Summary:')
  console.log('  • Core catalog seeded from SQL file (novels, episodes, reviews, comments, follows, wishlist, reading progress)')
  console.log('  • Added demo writer showcase novel with two walkthrough episodes')
  console.log('  • Added four login-ready demo accounts covering reader, writer, admin, developer roles')

    console.log('\n🎉 Database seeding completed!')
    console.log('\n📝 Sample Credentials (for testing):')
    demoUsers.forEach((user) => {
      console.log(`  ${user.role.toLowerCase()}: ${user.email} / ${user.password}`)
    })
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
