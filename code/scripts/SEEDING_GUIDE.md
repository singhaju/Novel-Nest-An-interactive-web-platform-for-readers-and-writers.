# Novel Nest Database Seeding Guide

This guide explains how to populate your Novel Nest database with sample data from the CSS326 project proposal.

## Files Included

- `seed_novels.sql` — Raw SQL script with all sample data
- `seed.js` — Node.js script that executes the SQL seed file

## What Gets Seeded

The seed script populates your database with:

### Users (7 total)
**Authors (Writers):**
- jane_austen (Pride and Prejudice author)
- frank_herbert (Dune author)
- jrr_tolkien (The Hobbit author)
- harper_lee (To Kill a Mockingbird author)
- george_orwell (1984 author)

**Readers:**
- BookLover22
- Bibliophile_Ben

### Novels (5 total)
1. **Pride and Prejudice** — Classic romance, 2 chapters
2. **Dune** — Sci-fi epic, 2 chapters
3. **The Hobbit** — Fantasy adventure, 2 chapters
4. **To Kill a Mockingbird** — Classic fiction, 2 chapters
5. **Nineteen Eighty-Four** — Dystopian novel, 2 chapters

### Episodes/Chapters (10 total)
- 2 chapters per novel
- First chapter is free (unlocked)
- Second chapter requires payment (locked, priced 10-15 coins)

### Reviews (10 total)
- 2 reviews per novel from readers
- Ratings and detailed comments

### Comments (10 total)
- Comments on various chapters
- 1 reply thread (showing parent-child relationships)

### Relationships
- 4 Follow relationships (readers following authors)
- 4 Wishlist items (readers adding novels to wishlists)
- 4 Reading progress entries (bookmark data)

## How to Run the Seed

### Option 1: Using npm script (Recommended)

```bash
# Install dependencies first (if not already done)
npm install

# Run the seed script
npm run seed
```

### Option 2: Direct SQL execution

If you prefer to manually run the SQL:

```bash
# Using MySQL CLI
mysql -u root -p novel_nest < scripts/seed_novels.sql

# Or import in a MySQL GUI like MySQL Workbench or phpMyAdmin
# Simply open scripts/seed_novels.sql and execute it
```

### Option 3: Using Prisma (if you prefer)

```bash
# First, ensure your Prisma schema is set up
npx prisma generate

# Then, if you have a Prisma seeder set up:
npx prisma db seed
```

## Prerequisites

Before running the seed, make sure:

1. **MySQL server is running** — Your database must be accessible
2. **.env file is configured** — Your `DATABASE_URL` must be correct:
   ```
   DATABASE_URL="mysql://root:Johnny2005!@localhost:3306/novel_nest"
   ```
3. **Database exists** — Create the database first:
   ```sql
   CREATE DATABASE novel_nest;
   ```
4. **Dependencies are installed** — Run `npm install` in the `/code` folder

## What Happens When You Run The Seed

The seed script:

1. ✅ Connects to your MySQL database
2. ✅ Creates tables if they don't exist
3. ✅ Inserts sample users (authors and readers)
4. ✅ Inserts 5 novels with metadata
5. ✅ Inserts episodes (chapters) for each novel
6. ✅ Inserts reviews from readers
7. ✅ Inserts comments on chapters
8. ✅ Creates author-novel relationships
9. ✅ Creates wishlist items
10. ✅ Creates follow relationships
11. ✅ Creates reading progress bookmarks

## Test Credentials

After seeding, you can log in with these test accounts:

### Writer/Author Login
```
Email: jausten@example.com
Password: pass4jane
(Author: Jane Austen - Pride and Prejudice)
```

### Reader Login
```
Email: reader22@example.com
Password: password123
(User: BookLover22)
```

**Note:** Passwords in the seed are hashed using bcrypt. The plain-text versions above are for reference only.

## Common Issues and Fixes

### Issue: "DATABASE_URL not found in .env"
**Solution:** Make sure your `.env` file in the `/code` folder has:
```
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### Issue: "Can't connect to MySQL server"
**Solution:** Ensure:
- MySQL is running on your machine
- Credentials in `.env` are correct
- Database exists: `CREATE DATABASE novel_nest;`

### Issue: "Table already exists" errors
**Solution:** The seed script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. If you want a fresh start:
```bash
# Drop and recreate the database
mysql -u root -p -e "DROP DATABASE novel_nest; CREATE DATABASE novel_nest;"

# Then run the seed again
npm run seed
```

### Issue: Foreign key constraint errors
**Solution:** If you see foreign key errors:
1. Ensure all tables are created before inserts happen
2. Check that the seed script is running in the correct order
3. Ensure your MySQL version supports the foreign key constraints used

## Modifying the Seed Data

To add your own novels:

1. Edit `scripts/seed_novels.sql`
2. Add new INSERT statements in the appropriate section
3. Follow the same format as existing entries
4. Run the seed again (it's safe to run multiple times)

## Removing Seed Data

To clear all seeded data:

```bash
# Drop and recreate the database
mysql -u root -p novel_nest
DROP TABLE IF EXISTS user_reading_progress;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS user_wishlist;
DROP TABLE IF EXISTS novel_authors;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS episodes;
DROP TABLE IF EXISTS novels;
DROP TABLE IF EXISTS users;
```

Then recreate the database:
```bash
CREATE DATABASE novel_nest;
npm run seed
```

## Next Steps

After seeding:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the app:**
   ```
   http://localhost:3000
   ```

3. **Log in with test credentials** — Use the credentials above

4. **Verify the data:**
   - Browse novels on the main page
   - Read reviews and comments
   - Check your profile for wishlist and reading progress
   - Explore author pages

## Database Structure

The seeded data follows this schema:

```
users
  ├── novels (written by authors)
  ├── reviews (written by readers)
  ├── comments (written by readers)
  ├── user_wishlist (novels saved)
  ├── user_follows (authors followed)
  └── user_reading_progress (reading bookmarks)

novels
  ├── episodes (chapters)
  ├── reviews (ratings and comments)
  └── comments (on episodes)

episodes
  └── comments (chapter discussions)
```

## Support

For issues or questions about the seed data:

1. Check the error message in the console
2. Verify your `.env` configuration
3. Ensure MySQL is running and accessible
4. Check that the database exists

---

**Created as part of CSS326 - Novel Nest Project**
