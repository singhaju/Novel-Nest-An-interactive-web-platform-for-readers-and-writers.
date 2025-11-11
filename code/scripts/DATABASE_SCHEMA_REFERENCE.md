# Novel Nest Database Schema & Seeded Data Reference

## Database Tables & Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        CORE TABLES                          │
└─────────────────────────────────────────────────────────────┘

users (7)
├─ ID: 101-107
├─ Types: Writer (5), Reader (2)
└─ Fields: username, email, password (hashed), profile_picture, bio, role, created_at

novels (5)
├─ ID: 2001-2005
├─ Authored by: users(101-105)
├─ Fields: title, description, cover_image, tags(JSON), status, views, likes, rating, last_update
└─ Relations: → episodes, → reviews, → comments, → wishlist, → follows

episodes (10)
├─ ID: 3001-3010
├─ 2 per novel
├─ Fields: novel_id, title, content, is_locked, price, release_date
└─ Relations: → comments

reviews (10)
├─ ID: 4001-4010
├─ 2 per novel
├─ Fields: novel_id, user_id, rating(1-5), comment, created_at
└─ Relations: novel ← → users

comments (10)
├─ ID: 5001-5010
├─ On episodes (varies per chapter)
├─ Fields: episode_id, user_id, parent_comment_id(nullable), content, created_at
└─ Relations: episode, user, parent comment(for threads)

┌─────────────────────────────────────────────────────────────┐
│                   RELATIONSHIP TABLES                       │
└─────────────────────────────────────────────────────────────┘

novel_authors (5)
├─ Composite Key: (user_id, novel_id)
├─ Stores: author_role (e.g., "Primary Author")
└─ Links: users ← → novels (co-authorship)

user_wishlist (4)
├─ Composite Key: (user_id, novel_id)
├─ Stores: added_at(timestamp)
└─ Links: users ← → novels

user_follows (4)
├─ Composite Key: (follower_id, following_id)
├─ Stores: followed_at(timestamp)
└─ Links: users ← → users (reader → author)

user_reading_progress (4)
├─ Composite Key: (user_id, novel_id)
├─ Stores: last_read_episode_id, updated_at
└─ Links: users ← → novels ← → episodes
```

## Seeded Data Breakdown

### Users (7)

| ID | Username | Email | Role | Bio |
|---|---|---|---|---|
| 101 | jane_austen | jausten@example.com | Writer | Novelist of manners and romance. |
| 102 | frank_herbert | fherbert@example.com | Writer | Chronicler of Arrakis and the Golden Path. |
| 103 | jrr_tolkien | jrrt@example.com | Writer | Philologist, poet, and author of Middle-earth. |
| 104 | harper_lee | hlee@example.com | Writer | Chronicler of Maycomb County. |
| 105 | george_orwell | gorwell@example.com | Writer | Essayist, journalist, and novelist. |
| 106 | BookLover22 | reader22@example.com | Reader | (null) |
| 107 | Bibliophile_Ben | ben@example.com | Reader | (null) |

### Novels (5)

| ID | Title | Author ID | Status | Episodes | Reviews | Views | Likes | Rating |
|---|---|---|---|---|---|---|---|---|
| 2001 | Pride and Prejudice | 101 | Completed | 2 | 2 | 150,230 | 12,500 | 4.95 |
| 2002 | Dune | 102 | Completed | 2 | 2 | 210,500 | 18,200 | 4.98 |
| 2003 | The Hobbit | 103 | Completed | 2 | 2 | 320,000 | 25,000 | 4.99 |
| 2004 | To Kill a Mockingbird | 104 | Completed | 2 | 2 | 180,450 | 15,300 | 4.96 |
| 2005 | Nineteen Eighty-Four | 105 | Completed | 2 | 2 | 255,000 | 21,000 | 4.97 |

### Episodes per Novel (10 total)

| Novel | Chapter 1 | Chapter 2 |
|---|---|---|
| Pride & Prejudice | Chapter 1: First Impressions (FREE) | Chapter 2: The Bennet Family (10 coins) |
| Dune | Book One: Ch1 (FREE) | Book One: Ch2 (15 coins) |
| The Hobbit | Chapter 1: An Unexpected Party (FREE) | Chapter 2: Roast Mutton (10 coins) |
| To Kill a Mockingbird | Part One, Ch1 (FREE) | Part One, Ch2 (10 coins) |
| Nineteen Eighty-Four | Part One, Ch1 (FREE) | Part One, Ch2 (15 coins) |

### Reviews (10 total)

| ID | Novel | Reader | Rating | Sample Comment |
|---|---|---|---|---|
| 4001 | Pride & Prejudice | BookLover22 (106) | 5 | "An absolute masterpiece of wit and romance..." |
| 4002 | Pride & Prejudice | Bibliophile_Ben (107) | 4 | "A brilliant novel. It can be a bit slow..." |
| 4003 | Dune | Bibliophile_Ben (107) | 5 | "The world-building is on another level..." |
| 4004 | Dune | BookLover22 (106) | 5 | "Intimidating at first, but once you get into it..." |
| 4005 | The Hobbit | BookLover22 (106) | 5 | "The perfect adventure story..." |
| 4006 | The Hobbit | Bibliophile_Ben (107) | 5 | "A fantastic introduction to Middle-earth..." |
| 4007 | To Kill a Mockingbird | Bibliophile_Ben (107) | 5 | "A powerful and moving story..." |
| 4008 | To Kill a Mockingbird | BookLover22 (106) | 5 | "Seeing the world through Scout's eyes..." |
| 4009 | Nineteen Eighty-Four | BookLover22 (106) | 5 | "Terrifying because of how plausible..." |
| 4010 | Nineteen Eighty-Four | Bibliophile_Ben (107) | 5 | "An absolute masterpiece of dystopian fiction..." |

### Comments (10 total)

| ID | Episode | Reader | Type | Sample Comment |
|---|---|---|---|---|
| 5001 | Ch1: Pride & Prejudice | Bibliophile_Ben (107) | Parent | "What a brilliant opening line!..." |
| 5002 | Ch2: Pride & Prejudice | BookLover22 (106) | Parent | "I love Mr. Bennet's dry humor..." |
| 5003 | Dune Ch1 | BookLover22 (106) | Parent | "The Bene Gesserit are so mysterious..." |
| 5004 | Dune Ch2 | Bibliophile_Ben (107) | Reply to 5003 | "Totally agree. The idea that pain..." |
| 5005 | Hobbit Ch1 | BookLover22 (106) | Parent | "The description of the hobbit-hole..." |
| 5006 | Hobbit Ch2 | Bibliophile_Ben (107) | Parent | "The trolls are hilarious..." |
| 5007 | Mockingbird Ch1 | BookLover22 (106) | Parent | "The way the history of the Finch family..." |
| 5008 | Mockingbird Ch2 | Bibliophile_Ben (107) | Parent | "Miss Caroline's first day is such..." |
| 5009 | 1984 Ch1 | Bibliophile_Ben (107) | Parent | "The description of the telescreen..." |
| 5010 | 1984 Ch2 | BookLover22 (106) | Parent | "The Parsons children are so creepy..." |

### Wishlist Items (4 total)

| Reader | Novel |
|---|---|
| BookLover22 (106) | Pride and Prejudice (2001) |
| BookLover22 (106) | Dune (2002) |
| Bibliophile_Ben (107) | The Hobbit (2003) |
| Bibliophile_Ben (107) | Nineteen Eighty-Four (2005) |

### Follow Relationships (4 total)

| Reader | Author |
|---|---|
| BookLover22 (106) | jane_austen (101) |
| BookLover22 (106) | jrr_tolkien (103) |
| Bibliophile_Ben (107) | frank_herbert (102) |
| Bibliophile_Ben (107) | harper_lee (104) |

### Reading Progress (4 total)

| Reader | Novel | Last Read Episode |
|---|---|---|
| BookLover22 (106) | Pride & Prejudice (2001) | Chapter 2 (3002) |
| BookLover22 (106) | The Hobbit (2003) | Chapter 1 (3005) |
| Bibliophile_Ben (107) | Dune (2002) | Chapter 2 (3004) |
| Bibliophile_Ben (107) | Nineteen Eighty-Four (2005) | Chapter 2 (3010) |

## Foreign Key Relationships

```
novels.author_id → users.user_id
episodes.novel_id → novels.novel_id
reviews.novel_id → novels.novel_id
reviews.user_id → users.user_id
comments.episode_id → episodes.episode_id
comments.user_id → users.user_id
comments.parent_comment_id → comments.comment_id (self-reference)

novel_authors.user_id → users.user_id
novel_authors.novel_id → novels.novel_id

user_wishlist.user_id → users.user_id
user_wishlist.novel_id → novels.novel_id

user_follows.follower_id → users.user_id
user_follows.following_id → users.user_id

user_reading_progress.user_id → users.user_id
user_reading_progress.novel_id → novels.novel_id
user_reading_progress.last_read_episode_id → episodes.episode_id
```

## Data Statistics

| Metric | Count |
|---|---|
| Total Users | 7 |
| Writers/Authors | 5 |
| Readers | 2 |
| Novels | 5 |
| Episodes/Chapters | 10 |
| Reviews | 10 |
| Comments | 10 |
| Comment Threads | 1 |
| Follow Relationships | 4 |
| Wishlist Items | 4 |
| Reading Progress Entries | 4 |
| Locked Episodes | 5 |
| Free Episodes | 5 |
| Total Views (all novels) | 1,115,180 |
| Total Likes (all novels) | 92,000 |
| Avg Rating | 4.97 ⭐ |

## How to Query the Data

### Get all novels by an author
```sql
SELECT n.* FROM novels n
WHERE n.author_id = 101;
```

### Get all reviews for a novel
```sql
SELECT r.*, u.username FROM reviews r
JOIN users u ON r.user_id = u.user_id
WHERE r.novel_id = 2001
ORDER BY r.created_at DESC;
```

### Get reading progress for a reader
```sql
SELECT n.title, e.title, urp.updated_at FROM user_reading_progress urp
JOIN novels n ON urp.novel_id = n.novel_id
JOIN episodes e ON urp.last_read_episode_id = e.episode_id
WHERE urp.user_id = 106;
```

### Get authors followed by a reader
```sql
SELECT u.* FROM user_follows uf
JOIN users u ON uf.following_id = u.user_id
WHERE uf.follower_id = 106;
```

---

**Data Version:** 1.0  
**Created:** November 11, 2025  
**Based on:** CSS326 Novel Nest Project Proposal  
**Last Updated:** Ready for seeding
