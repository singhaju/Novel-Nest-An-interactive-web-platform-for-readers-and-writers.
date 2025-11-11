# Novel Nest Database Seed - Implementation Summary

## What Was Created

I've created a complete database seeding solution for your Novel Nest application based on the CSS326 project proposal. Here are the files:

### Files Created

1. **`scripts/seed_novels.sql`** (1000+ lines)
   - Complete SQL script with all sample data
   - Creates tables if they don't exist
   - Inserts 7 users, 5 novels, 10 episodes, 10 reviews, 10 comments
   - Includes all relationships and metadata

2. **`scripts/seed.js`**
   - Node.js script to execute the SQL file
   - Parses DATABASE_URL from .env
   - Provides progress feedback
   - Error handling and connection management

3. **`scripts/SEEDING_GUIDE.md`**
   - Comprehensive documentation
   - Setup instructions
   - Test credentials
   - Troubleshooting guide

4. **Updated `package.json`**
   - Added `npm run seed` script
   - Added `dotenv` and `mysql2` dependencies

## The Sample Data

### 5 Novels (from CSS326 proposal)
| Novel | Author | Episodes | Status |
|-------|--------|----------|--------|
| Pride and Prejudice | jane_austen | 2 | Completed |
| Dune | frank_herbert | 2 | Completed |
| The Hobbit | jrr_tolkien | 2 | Completed |
| To Kill a Mockingbird | harper_lee | 2 | Completed |
| Nineteen Eighty-Four | george_orwell | 2 | Completed |

### 7 Users
- **5 Authors:** jane_austen, frank_herbert, jrr_tolkien, harper_lee, george_orwell
- **2 Readers:** BookLover22, Bibliophile_Ben

### 10 Episodes
- 2 per novel
- First chapter = Free (is_locked = 0)
- Second chapter = Paid (is_locked = 1, price 10-15 coins)

### 10 Reviews
- 2 per novel
- From readers to novels
- Include ratings (4-5 stars) and detailed comments

### 10 Comments
- On various episodes
- Includes 1 reply thread (parent-child relationship)

### Relationships
- 4 Follow relationships (readers → authors)
- 4 Wishlist items (readers → novels)
- 4 Reading progress entries (bookmarks)

## How to Use

### Step 1: Install Dependencies
```bash
cd code
npm install
```

### Step 2: Verify .env Configuration
Make sure your `.env` file has:
```
DATABASE_URL="mysql://root:Johnny2005!@localhost:3306/novel_nest"
```

### Step 3: Run the Seed
```bash
npm run seed
```

You'll see output like:
```
🌱 Starting Novel Nest database seed...
📡 Connecting to MySQL database: novel_nest at localhost:3306
✅ Connected to database successfully!
📖 Seed file loaded
⏳ Executing seed script...

✨ Seed script executed successfully!

📊 Data Summary:
  • 7 Users (5 Authors, 2 Readers)
  • 5 Novels
  • 10 Episodes (2 per novel)
  • 10 Reviews
  • 10 Comments
  • 4 Follow Relationships
  • 4 Wishlist Items
  • 4 Reading Progress Entries

🎉 Database seeding completed!
```

## Test the Data

### Log in as an Author
```
Email: jausten@example.com
Password: pass4jane
```
Then you can:
- View your novels
- See reviews from readers
- Check reading progress

### Log in as a Reader
```
Email: reader22@example.com
Password: password123
```
Then you can:
- Browse novels
- Read episodes (some locked)
- Leave reviews and comments
- Add to wishlist
- Follow authors

## Database Schema (Seeded)

```
novels (5)
├── episodes (10) — 2 per novel
├── reviews (10) — 2 per novel
└── comments (10) — on episodes

users (7)
├── novel_authors (5) — author-novel relationships
├── user_wishlist (4) — reader→novel
├── user_follows (4) — reader→author
└── user_reading_progress (4) — bookmarks
```

## What Happens in the Seed Script

When you run `npm run seed`:

1. ✅ Reads `.env` and connects to MySQL
2. ✅ Creates all tables (if they don't exist)
3. ✅ Inserts 7 users with hashed passwords
4. ✅ Inserts 5 novels with metadata + Google Drive URLs
5. ✅ Inserts 10 episodes (chapters with content)
6. ✅ Inserts 10 reviews from readers
7. ✅ Inserts 10 comments with threading
8. ✅ Creates all relationships (wishlist, follows, reading progress)
9. ✅ Completes with summary

## Database URLs

The seed uses Google Drive URLs for:
- **`cover_image`** — Novel covers (placeholder format: `https://drive.google.com/uc?id=...`)
- **`profile_picture`** — User avatars (real Pexels URLs)
- **`content`** — Episode content (placeholder format: `https://docs.google.com/document/d/...`)

You can update these after seeding if you have actual Google Drive links.

## SQL Seed Details

### Users Table
```sql
INSERT INTO `users` VALUES
(101, 'jane_austen', 'jausten@example.com', '$2b$10$...hashed...', profile_picture, bio, 'Writer', created_at),
...
```

### Novels Table
```sql
INSERT INTO `novels` VALUES
(2001, 'Pride and Prejudice', description, cover_image, JSON tags, 'Completed', last_update, views, likes, rating, author_id),
...
```

### Episodes Table
```sql
INSERT INTO `episodes` VALUES
(3001, 2001, 'Chapter 1', content_text, is_locked=0, price=NULL, release_date),
(3002, 2001, 'Chapter 2', content_text, is_locked=1, price=10, release_date),
...
```

And so on for reviews, comments, and relationships.

## Safe to Run Multiple Times

The seed script uses `ON DUPLICATE KEY UPDATE` for all inserts, making it safe to run multiple times without errors.

To do a fresh seed:
```bash
# Drop the database
mysql -u root -p -e "DROP DATABASE novel_nest;"

# Recreate it
mysql -u root -p -e "CREATE DATABASE novel_nest;"

# Run seed again
npm run seed
```

## Next Steps

1. **Verify the data** — Log in and browse the novels, reviews, and comments
2. **Check relationships** — Test wishlists, follows, and reading progress
3. **Explore the app** — Navigate through author pages, profiles, and episodes
4. **Add more data** — If you want more novels, edit `seed_novels.sql` and add more INSERT statements
5. **Customize** — Replace Google Drive URLs with your actual file links when ready

## File Locations

```
code/
├── scripts/
│   ├── seed.js                    ← Node.js seeding script
│   ├── seed_novels.sql            ← SQL data file
│   └── SEEDING_GUIDE.md           ← Full documentation
├── package.json                   ← Updated with seed script
└── prisma/
    └── schema.prisma              ← Prisma schema
```

---

**Created:** November 11, 2025  
**Based on:** CSS326 Novel Nest Project Proposal  
**Status:** Ready to use  
**Command:** `npm run seed`
