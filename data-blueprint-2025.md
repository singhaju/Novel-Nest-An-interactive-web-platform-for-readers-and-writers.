# Novel Nest Data Blueprint

This document consolidates the refreshed user flows, physical MySQL design, and entity attributes for the Novel Nest platform. It captures how the current codebase (Next.js App Router + mysql2) interacts with the database, the bundled `/public/pictures` static assets (for seeded novels), and Google Drive uploads without requiring application code changes.

---

## 1. Updated Role-Centric User Flows

The tables below show the decisive steps per role, aligning UI intent, backend logic, and concrete MySQL touchpoints. Each flow assumes authentication is already handled via NextAuth and role data lives in `users.role`.

### 1.1 Core Auth Flow (All Roles)

| Step | UI Surface | Backend Logic | Database Interaction |
| --- | --- | --- | --- |
| 1 | **Sign up**: username, email, password form | Validate password strength (`lib/password-policy.ts`), hash credential, assign default role (`READER`). | `INSERT` into `users`; profile picture stored as Drive URL if provided. |
| 2 | **Login** | Validate credentials, hydrate session with `role`, `user_id`. | `SELECT` from `users` by email/username; failed attempts logged separately (Supabase/NextAuth tables). |
| 3 | **Role routing** | On session restore, route to reader home, writer dashboard, admin suite, etc. | No write; uses previously fetched `users.role`. |

### 1.2 Reader Journey

| Step | UI Surface | Backend Logic | Database Interaction |
| --- | --- | --- | --- |
| 1 | **Discover** (home, search, filters) | Compose query from genre/tags/status filters; optionally rank via trending procedure. | `SELECT` on `novels` (filtered, ordered by `views`/`rating`). |
| 2 | **Wishlist / Follow / Like** on novel detail | Guard against duplicates, enforce auth. | `INSERT` into `user_wishlist`, `user_follows`, or `likes` with `ON DUPLICATE KEY` semantics; increments counters via triggers. |
| 3 | **Review** | Validate one review per novel per user, sanitize text. | `INSERT` into `reviews`; triggers recalc `novels.rating`. |
| 4 | **Read episode** | Serve Drive doc link after access check; mount delayed tracker. | `SELECT content` URL from `episodes`; after 10s dwell, POST `/api/novels/{id}/views` which `UPDATE`s `novels.views`. |
| 5 | **Bookmark** | Client invokes `UpdateReadingProgress` procedure. | Stored procedure `UpdateReadingProgress` writes/updates `user_reading_progress`. |
| 6 | **Comment** | Optionally capture `parent_comment_id`. | `INSERT` into `comments` (self-referencing FK). |
| 7 | **Profile edits** | Validate bio/image; upload new avatar to Drive, persist URL. | `UPDATE users SET bio, profile_picture`. |

### 1.3 Writer Journey

| Step | UI Surface | Backend Logic | Database Interaction |
| --- | --- | --- | --- |
| 1 | **Writer dashboard** | Summaries of novels, episodes, engagement. | Aggregated `SELECT` on `novels`, `episodes`, `likes`, `reviews` filtered by `author_id`. |
| 2 | **Create novel** | Validate metadata, upload cover to Drive, auto status `PENDING_APPROVAL`. | `INSERT` into `novels`; Drive share link stored in `cover_image`. |
| 3 | **Manage co-authors** | Assign collaborator roles. | `INSERT/DELETE` rows in `novel_authors` with `author_role`. |
| 4 | **Create / edit episode** | Upload manuscript to Drive (content doc link), enforce sequential numbering, handle price/is_locked. | `INSERT` or `UPDATE` on `episodes`; `last_update` on parent `novels` auto-updated. |
| 5 | **Respond to reader feedback** | Surface reviews/comments; optionally reply in-thread. | No structural change beyond reading `reviews`, `comments`. |

### 1.4 Admin & SuperAdmin Oversight

| Step | UI Surface | Backend Logic | Database Interaction |
| --- | --- | --- | --- |
| 1 | **Admin dashboard** | Global KPIs across users, novels, episodes, reports. | `SELECT COUNT(*)` aggregations on `users`, `novels`, `reviews`, `episodes`. |
| 2 | **User management** | Suspend, verify writer, elevate to superadmin. | `UPDATE users SET role = ?, is_banned = ?`. |
| 3 | **Novel moderation** | Approve/deny novels & episodes, inspect reported comments. | `UPDATE novels.status` / `episodes.status`; optional `DELETE` from `comments`. |
| 4 | **System auditing** | SuperAdmins export data, inspect triggers/procs. | `SELECT` from all core tables; `mysqldump` for backups (as already demonstrated). |

### 1.5 Developer Diagnostics Flow

| Step | UI Surface | Backend Logic | Database Interaction |
| --- | --- | --- | --- |
| 1 | **Developer console** | Enforce `users.role = 'DEVELOPER'` before rendering metrics. | `SELECT role FROM users WHERE user_id = ?`. |
| 2 | **Feature flag / config edits** | Manage experimental toggles. | `SELECT/UPDATE` on `system_config` (optional table; create as needed). |
| 3 | **DB health checks** | Run EXPLAIN, index stats, and view trigger definitions. | Read-only queries on `INFORMATION_SCHEMA`, `SHOW TRIGGERS`, stored procedure metadata. |

---

## 2. Physical Design (MySQL + Google Drive Linkage)

| Table | Engine / Notes | Primary & Foreign Keys | Google Drive Linkage | Purpose |
| --- | --- | --- | --- | --- |
| `users` | InnoDB, row-level RBAC, supports `SUPERADMIN` | `PRIMARY KEY (user_id)`; referenced by almost every table | `profile_picture` stores Drive URL | Master account record (all roles). |
| `novels` | InnoDB, `status` ENUM with moderation states | `PRIMARY KEY (novel_id)`; FK `author_id → users.user_id` | `cover_image` stores either a `/pictures/...` path (seeded defaults) or Drive share link (user uploads) | Canonical metadata per novel, including counters and tags JSON string. |
| `episodes` | InnoDB, cascades on novel delete | `PRIMARY KEY (episode_id)`; FK `novel_id → novels` | `content` holds Drive doc URL | Individual chapters with gating fields (`status`, `is_locked`, `price`). |
| `reviews` | InnoDB, trigger-backed rating sync | `PRIMARY KEY (review_id)`; FKs to `novels`, `users` | None | Reader ratings/comments per novel; drives aggregate rating. |
| `comments` | InnoDB, self-FK (`parent_comment_id`) | `PRIMARY KEY (comment_id)`; FKs to `episodes`, `users`, self | None | Episode discussion threads, supports replies. |
| `novel_authors` | InnoDB bridge | Composite PK (`user_id`, `novel_id`) referencing `users`, `novels` | None | Manages co-authorship roles. |
| `user_wishlist` | InnoDB bridge | Composite PK (`user_id`, `novel_id`) referencing `users`, `novels` | None | Wishlist relationships feeding "save for later" UX. |
| `user_follows` | InnoDB bridge | Composite PK (`follower_id`, `following_id`) referencing `users` | None | Social follow graph between readers and writers. |
| `user_reading_progress` | InnoDB bridge | Composite PK (`user_id`, `novel_id`); FK to `episodes` | None | Bookmark / last-read tracking; maintained via `UpdateReadingProgress`. |
| `likes` | InnoDB bridge | Composite PK (`user_id`, `novel_id`) referencing `users`, `novels` | None | Discrete user likes powering engagement counters. |
| `system_config` *(optional)* | InnoDB | `PRIMARY KEY (config_key)` | None | Feature flags / developer settings (add as needed). |

**Indexes & Performance Notes**
- Ensure secondary indexes on all FK columns (`novel_id`, `user_id`, `episode_id`) plus composite indexes for high-frequency lookups (e.g., `user_reading_progress (user_id, novel_id)`).
- Materialized aggregates (e.g., `novels.views`, `novels.likes`) are stored denormalized for fast landing-page rendering; triggers keep them fresh.
- Google Drive assets remain authoritative for large binaries; MySQL only stores the immutable share URL/ID, avoiding BLOB storage costs.

**Static Asset Notes**
- `public/pictures` (served at `/pictures/...`) hosts the curated demo covers bundled with the repo; seed data points to these files by default.
- Writer uploads continue to use Google Drive via the existing uploader; the application simply surfaces whichever path is stored in `cover_image`.

---

## 3. Entity Attribute Matrix

Each entity inherits default `created_at` timestamps (and `updated_at` where applicable). Types reflect the actual MySQL schema used in `/scripts/seed_novels.sql` and live migrations.

### 3.1 Users

| Attribute | Type | Constraints / Notes |
| --- | --- | --- |
| `user_id` | `INT` (AUTO_INCREMENT) | PK, positive, referenced by all child tables. |
| `username` | `VARCHAR(255)` | Unique, non-null. |
| `email` | `VARCHAR(255)` | Unique, non-null, validated upstream. |
| `password` | `VARCHAR(255)` | Stores bcrypt hash. |
| `profile_picture` | `VARCHAR(255)` | Nullable Drive URL (`https://drive.google.com/...`). |
| `bio` | `TEXT` | Nullable, used mainly by writers. |
| `role` | `ENUM('READER','WRITER','ADMIN','DEVELOPER','SUPERADMIN')` | Default `READER`. |
| `is_banned` | `TINYINT(1)` | Default 0; enforced by admin flows. |
| `created_at` | `TIMESTAMP` | Defaults to `CURRENT_TIMESTAMP`. |

### 3.2 Novels

| Attribute | Type | Constraints / Notes |
| --- | --- | --- |
| `novel_id` | `INT` AUTO_INCREMENT | PK. |
| `author_id` | `INT` | FK → `users.user_id` (nullable when transferred to team). |
| `title` | `VARCHAR(255)` | Required. |
| `description` | `TEXT` | Optional synopsis. |
| `cover_image` | `VARCHAR(255)` | Either `/pictures/<filename>` (bundled static art) or a Drive URL uploaded by writers. |
| `tags` | `TEXT` | Stores JSON array string (e.g., `"[\"fantasy\"]"`). |
| `status` | `ENUM('ONGOING','COMPLETED','HIATUS','PENDING_APPROVAL','DENIAL')` | Aligned with moderation workflow. |
| `last_update` | `TIMESTAMP` | Auto-updated on episode changes. |
| `views` | `INT` | Incremented via delayed tracker once readers spend ≥10s in content view. |
| `likes` | `INT` | Maintained via likes trigger (or API). |
| `rating` | `DECIMAL(3,2)` | Updated via review triggers. |
| `created_at` | `TIMESTAMP` | Creation time. |

### 3.3 Episodes

| Attribute | Type | Constraints / Notes |
| --- | --- | --- |
| `episode_id` | `INT` AUTO_INCREMENT | PK. |
| `novel_id` | `INT` | FK → `novels`. Cascades on delete. |
| `title` | `VARCHAR(255)` | Required. |
| `content` | `TEXT` | Drive doc URL; actual manuscript stored in Drive. |
| `status` | `ENUM('PENDING_APPROVAL','APPROVED','DENIAL')` | Controls visibility. |
| `is_locked` | `BOOLEAN` | Monetization toggle. |
| `price` | `INT` | Optional coin cost. |
| `release_date` | `DATETIME` | Defaults `CURRENT_TIMESTAMP`. |
| `updated_at` | `DATETIME` | Auto-updates on edit. |

### 3.4 Reviews

| Attribute | Type | Constraints / Notes |
| --- | --- | --- |
| `review_id` | `INT` AUTO_INCREMENT | PK. |
| `novel_id` | `INT` | FK → `novels`. |
| `user_id` | `INT` | FK → `users`. |
| `rating` | `INT` | 1-5 check constraint (enforced via application + DB). |
| `comment` | `TEXT` | Optional. |
| `created_at` | `TIMESTAMP` | Defaults `CURRENT_TIMESTAMP`. |

### 3.5 Comments

| Attribute | Type | Constraints / Notes |
| --- | --- | --- |
| `comment_id` | `INT` AUTO_INCREMENT | PK. |
| `episode_id` | `INT` | FK → `episodes`. |
| `user_id` | `INT` | FK → `users`. |
| `parent_comment_id` | `INT` | Self-FK for replies (nullable). |
| `content` | `TEXT` | Required. |
| `created_at` | `TIMESTAMP` | Defaults `CURRENT_TIMESTAMP`. |

### 3.6 Junction Tables

| Table | Composite Key | Additional Columns | Notes |
| --- | --- | --- | --- |
| `novel_authors` | (`user_id`,`novel_id`) | `author_role VARCHAR(100)` | Supports co-author attributions (Primary Author, Illustrator, etc.). |
| `user_wishlist` | (`user_id`,`novel_id`) | `added_at TIMESTAMP` | Powers wishlist UI; duplicates prevented by PK. |
| `user_follows` | (`follower_id`,`following_id`) | `followed_at TIMESTAMP` | Reader-follow graph. |
| `user_reading_progress` | (`user_id`,`novel_id`) | `last_read_episode_id INT`, `updated_at TIMESTAMP` | Maintained via stored procedure; ensures FK to `episodes`. |
| `likes` | (`user_id`,`novel_id`) | `created_at TIMESTAMP` (add via migration if absent) | Drives `novels.likes` counter. |

---

## 4. Automation & Integrity Guards

- **Stored Procedure `UpdateReadingProgress`**: Ensures idempotent bookmark updates and returns the latest row to the caller.
- **Triggers `tr_reviews_after_*`**: Maintain `novels.rating` averages whenever reviews change.
- **Planned Trigger (`on_like_change`)**: Keep `novels.likes` synchronized if not already handled by API logic.
- **Delayed View Increment**: Client waits 10 seconds before calling `/api/novels/{id}/views`, ensuring `novels.views` reflects genuine reading engagement.

---

## 5. Deliverable Notes & Next Steps

1. **Documentation Use** – Include this file in the submission bundle (`docs/data-blueprint-2025.md`) to demonstrate updated planning artifacts without altering source code.
2. **Verification** – Align any future migrations in `/scripts` with this blueprint to keep schema drift minimal.
