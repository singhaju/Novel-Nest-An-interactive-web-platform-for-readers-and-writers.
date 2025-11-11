# Novel Nest ERD (Entity Relationship Diagram) - Text Version

## Visual Database Schema

```
                            ┌──────────────┐
                            │    Users     │
                            ├──────────────┤
                            │ user_id (PK) │
                            │ username     │
                            │ email        │
                            │ password     │
                            │ profile_pic  │
                            │ bio          │
                            │ role         │
                            │ created_at   │
                            └────┬─────────┘
                          ▲      │      ▲
                ┌─────────┘      │      └──────────┐
                │                │                  │
                │                │                  │
          (1:N) │          (1:N) │           (M:M)  │
        writes  │         writes │          follows │
                │                │                  │
            ┌───▼────────┐       ▼──────────────────┼──────┐
            │  Novels    │    Novel_Authors       Writers   │
            ├────────────┤   (Bridge Table)     (same Users)│
            │ novel_id   │   ├──────────────┤               │
            │ title      │   │ user_id (FK) │               │
            │ description│   │ novel_id(FK) │               │
            │ cover_img  │   │ author_role  │               │
            │ tags(JSON) │   └──────────────┘               │
            │ status     │        ▲                          │
            │ views      │        │                          │
            │ likes      │      (M:M)                        │
            │ rating     │   (co-authored)                   │
            │ author_id  │                                   │
            │(FK→Users)  │                                   │
            └────┬───────┘                                   │
                 │ (1:N)                                     │
                 │ has episodes                              │
                 │                                            │
            ┌────▼───────────┐                               │
            │   Episodes     │                               │
            ├────────────────┤                               │
            │ episode_id(PK) │                               │
            │ novel_id(FK)   │                               │
            │ title          │                               │
            │ content        │                               │
            │ is_locked      │                               │
            │ price          │                               │
            │ release_date   │                               │
            └────┬───────────┘                               │
                 │ (1:N)                                     │
                 │ has comments                              │
                 │                                            │
            ┌────▼───────────────┐                           │
            │  Comments          │                           │
            ├────────────────────┤                           │
            │ comment_id(PK)     │                           │
            │ episode_id(FK)     │                           │
            │ user_id(FK)────────┼───────────────────────────┘
            │ parent_comment_id  │       (1:N)
            │  (FK, self-ref)    │    writes comments
            │ content            │
            │ created_at         │
            └────────────────────┘
                 ▲
                 │ (1:N)
            (reply to)
                 │
           (self-reference for threading)


            ┌──────────────────┐
            │  User_Wishlist   │────────────────┐
            ├──────────────────┤ (M:M Bridge)   │
            │ user_id(FK)      │                │
            │ novel_id(FK)     │                ▼
            │ added_at         │         ┌──────────────┐
            └──────────────────┘         │  Wishlist    │
                                         │ Collections  │
            ┌──────────────────┐         │ (per user)   │
            │  User_Follows    │         └──────────────┘
            ├──────────────────┤
            │ follower_id(FK)  │────┐
            │ following_id(FK) │    │ (M:M self-reference)
            │ followed_at      │◄───┘ (readers→authors)
            └──────────────────┘

            ┌─────────────────────────────┐
            │ User_Reading_Progress       │
            ├─────────────────────────────┤
            │ user_id(FK)                 │
            │ novel_id(FK)────────────────┼──┐
            │ last_read_episode_id(FK)────┼──┼──┐
            │ updated_at                  │  │  │
            └─────────────────────────────┘  │  │
                                              │  │
                              Points to last  │  │
                              read chapter ───┘  │
                              (bookmark)         │
                              Points to         │
                              Novel ────────────┘


            ┌──────────────────┐
            │     Reviews      │
            ├──────────────────┤
            │ review_id(PK)    │
            │ novel_id(FK)─────┼──→ Novels
            │ user_id(FK)──────┼──→ Users
            │ rating(1-5)      │
            │ comment          │
            │ created_at       │
            └──────────────────┘
```

## Key Relationships Explained

### One-to-Many (1:N)
- A User can write many Novels
- A Novel has many Episodes
- A Novel has many Reviews
- An Episode has many Comments
- A User can post many Comments
- A User can post many Reviews

### Many-to-Many (M:M)

#### Novel_Authors (Co-authorship)
```
Writers ←→ Novels
Multiple authors can write one novel
One author can write multiple novels
Bridge table tracks: user_id, novel_id, author_role
```

#### User_Wishlist (Saved novels)
```
Readers ←→ Novels
A reader can add multiple novels to wishlist
A novel can be in multiple readers' wishlists
Bridge table tracks: user_id, novel_id, added_at
```

#### User_Follows (Follow authors)
```
Readers ←→ Authors (same Users table)
A reader can follow multiple authors
An author can be followed by multiple readers
Bridge table tracks: follower_id, following_id, followed_at
Self-referencing relationship
```

#### User_Reading_Progress (Bookmarks)
```
Readers ←→ Novels ←→ Episodes
Each reader's position in each novel
Tracks: user_id, novel_id, last_read_episode_id, updated_at
```

## Cascading Deletes

When you delete a record:
- Delete a User → deletes their comments, reviews, wishlist items, follows, reading progress
- Delete a Novel → deletes all episodes, reviews, wishlist entries, reading progress
- Delete an Episode → deletes all comments on that episode
- Delete a Comment → deletes any replies to it (via parent_comment_id)

## Table Indexes

For performance, these fields are indexed:
- users.username (UNIQUE)
- users.email (UNIQUE)
- novels.author_id (for filtering by author)
- novels.status (for filtering novels)
- episodes.novel_id (for fetching chapters)
- reviews.novel_id (for listing reviews)
- reviews.user_id (for user's review history)
- comments.episode_id (for chapter discussions)
- comments.user_id (for user's comments)
- comments.parent_comment_id (for comment threads)

## JSON Fields

- novels.tags — Stored as JSON array
  ```json
  ["fantasy", "magic", "adventure"]
  ```

## Enum Fields

- users.role — ENUM('Reader', 'Writer', 'Admin', 'Developer')
- novels.status — ENUM('Ongoing', 'Completed', 'Hiatus')

## Timestamp Fields

- created_at — When record was created (auto-set to CURRENT_TIMESTAMP)
- updated_at — When record was last modified (auto-update)
- last_update — Last time novel was updated

## Data Types

| Field | Type | Size | Purpose |
|-------|------|------|---------|
| IDs (primary keys) | INT | 4 bytes | Unique identifiers |
| names/titles | VARCHAR | 255 chars | Text fields |
| descriptions/content | TEXT | 65KB | Long text |
| emails | VARCHAR | 255 chars | Email addresses |
| passwords | VARCHAR | 255 chars | Hashed passwords |
| URLs | VARCHAR | 255 chars | Image/document links |
| bio | TEXT | 65KB | User biography |
| tags | JSON | Variable | Array of strings |
| rating | DECIMAL(3,2) | 3 digits, 2 decimal | 0.00-5.00 |
| views/likes | INT | 4 bytes | Counters |
| price | INT | 4 bytes | Coin cost |
| is_locked | BOOLEAN | 1 byte | True/False |
| timestamps | TIMESTAMP | 4 bytes | Date & time |

---

**Version:** 1.0  
**Created:** November 11, 2025  
**Reference:** CSS326 Novel Nest Database Design
