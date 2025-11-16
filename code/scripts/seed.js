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
      },
      {
        username: 'superadmin_demo',
        email: 'superadmin@novelnest.dev',
        role: 'SUPERADMIN',
        password: 'Super1234!',
        profile_picture: 'https://i.pravatar.cc/150?img=71',
        bio: 'Highest-level administrator with full platform oversight.'
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
    console.log('  • Added five login-ready demo accounts covering reader, writer, admin, developer, superadmin roles')

    console.log('\n🛠️ Installing advanced SQL features (stored procedures + triggers)...')

    const advancedSqlStatements = [
      `CREATE TABLE IF NOT EXISTS deleted_users_log (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        username VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(32),
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `DROP TRIGGER IF EXISTS log_user_deletions`,
      `CREATE TRIGGER log_user_deletions
      BEFORE DELETE ON users
      FOR EACH ROW
      BEGIN
        INSERT INTO deleted_users_log (user_id, username, email, role)
        VALUES (OLD.user_id, OLD.username, OLD.email, OLD.role);
      END`,
      `DROP PROCEDURE IF EXISTS UpdateReadingProgress`,
      `CREATE PROCEDURE UpdateReadingProgress(IN p_user_id INT, IN p_novel_id INT, IN p_episode_id INT)
      BEGIN
        INSERT INTO user_reading_progress (user_id, novel_id, last_read_episode_id, updated_at)
        VALUES (p_user_id, p_novel_id, p_episode_id, NOW())
        ON DUPLICATE KEY UPDATE
          last_read_episode_id = VALUES(last_read_episode_id),
          updated_at = NOW();

        SELECT user_id, novel_id, last_read_episode_id, updated_at
        FROM user_reading_progress
        WHERE user_id = p_user_id AND novel_id = p_novel_id;
      END`,
      `DROP TRIGGER IF EXISTS tr_reviews_after_insert`,
      `CREATE TRIGGER tr_reviews_after_insert
      AFTER INSERT ON reviews
      FOR EACH ROW
      UPDATE novels
      SET rating = (
        SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
        FROM reviews r
        WHERE r.novel_id = NEW.novel_id
      )
      WHERE novel_id = NEW.novel_id`,
      `DROP TRIGGER IF EXISTS tr_reviews_after_update`,
      `CREATE TRIGGER tr_reviews_after_update
      AFTER UPDATE ON reviews
      FOR EACH ROW
      UPDATE novels
      SET rating = (
        SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
        FROM reviews r
        WHERE r.novel_id = NEW.novel_id
      )
      WHERE novel_id = NEW.novel_id`,
      `DROP TRIGGER IF EXISTS tr_reviews_after_delete`,
      `CREATE TRIGGER tr_reviews_after_delete
      AFTER DELETE ON reviews
      FOR EACH ROW
      UPDATE novels
      SET rating = (
        SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
        FROM reviews r
        WHERE r.novel_id = OLD.novel_id
      )
      WHERE novel_id = OLD.novel_id`,
      `DROP PROCEDURE IF EXISTS GetTrendingNovels`,
      `CREATE PROCEDURE GetTrendingNovels(IN p_time_period VARCHAR(10))
      BEGIN
        SELECT
          n.novel_id,
          n.title,
          n.description,
          n.cover_image,
          n.tags,
          n.status,
          n.views,
          n.likes,
          n.rating,
          n.created_at,
          n.last_update,
          n.author_id,
          u.username AS author_username,
          u.profile_picture AS author_profile_picture,
          COUNT(r.review_id) AS total_reviews,
          SUM(
            CASE
              WHEN p_time_period = 'daily' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1
              WHEN p_time_period = 'weekly' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 1
              WHEN p_time_period = 'monthly' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1
              WHEN p_time_period NOT IN ('daily','weekly','monthly') THEN 1
              ELSE 0
            END
          ) AS recent_review_score
        FROM novels n
        LEFT JOIN users u ON u.user_id = n.author_id
        LEFT JOIN reviews r ON r.novel_id = n.novel_id
        GROUP BY n.novel_id
        ORDER BY (n.views + n.likes + COALESCE(recent_review_score, 0)) DESC, n.last_update DESC
        LIMIT 50;
      END`,
      `DROP PROCEDURE IF EXISTS AddToWishlist`,
      `CREATE PROCEDURE AddToWishlist(IN p_user_id INT, IN p_novel_id INT)
      BEGIN
        INSERT INTO user_wishlist (user_id, novel_id, added_at)
        VALUES (p_user_id, p_novel_id, NOW())
        ON DUPLICATE KEY UPDATE added_at = VALUES(added_at);
      END`,
      `DROP PROCEDURE IF EXISTS RemoveFromWishlist`,
      `CREATE PROCEDURE RemoveFromWishlist(IN p_user_id INT, IN p_novel_id INT)
      BEGIN
        DELETE FROM user_wishlist
        WHERE user_id = p_user_id AND novel_id = p_novel_id;
      END`,
      `DROP PROCEDURE IF EXISTS FollowAuthor`,
      `CREATE PROCEDURE FollowAuthor(IN p_follower_id INT, IN p_following_id INT)
      BEGIN
        INSERT INTO user_follows (follower_id, following_id, followed_at)
        VALUES (p_follower_id, p_following_id, NOW())
        ON DUPLICATE KEY UPDATE followed_at = VALUES(followed_at);
      END`,
      `DROP PROCEDURE IF EXISTS UnfollowAuthor`,
      `CREATE PROCEDURE UnfollowAuthor(IN p_follower_id INT, IN p_following_id INT)
      BEGIN
        DELETE FROM user_follows
        WHERE follower_id = p_follower_id AND following_id = p_following_id;
      END`,
    ]

    for (const statement of advancedSqlStatements) {
      await connection.query(statement)
    }

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
