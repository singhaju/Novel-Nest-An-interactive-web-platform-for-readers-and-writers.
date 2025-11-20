# Novel Nest – Final Setup Guide

Use this single document to set up the platform from scratch on any machine.

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 18.x or newer | `node --version` / `npm --version` to confirm. |
| Git | Latest | Needed if you clone from GitHub. |
| MySQL | 8.0+ | Start the service locally (MySQL80 on Windows). |
| VS Code (recommended) | Latest | Provides TypeScript/Next.js tooling. |

> **Windows tip:** run PowerShell as Administrator when installing dependencies, generating Prisma clients, or starting MySQL to avoid `EPERM` permission errors.

---

## 2. Clone or Download the Project

```bash
# clone (preferred)
git clone <repo-url>
cd Novel-Nest-An-interactive-web-platform-for-readers-and-writers/code

# or, download the ZIP and cd into /code after extracting
```

---

## 3. Install Dependencies

```bash
npm install
```

If the Prisma postinstall step fails with `query_engine-windows.dll` rename issues, close VS Code and terminals, delete `node_modules/.prisma`, pause antivirus/Controlled Folder Access, then rerun `npm install` from an elevated PowerShell.

---

## 4. Configure Environment Variables

Create `code/.env`:

```env
# Database
DATABASE_URL="mysql://novelnest_user:YOUR_PASSWORD@localhost:3306/novel_nest"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<output of openssl rand -base64 32>"

# Google Drive
GOOGLE_DRIVE_FOLDER_ID="<drive folder id>"
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"
```

- Never commit `.env` or `google-credentials.json`.
- If secrets leak, rotate them immediately.

---

## 5. Prepare MySQL

1. Start the service:
   - Windows: `net start MySQL80`
   - macOS: `brew services start mysql`
   - Linux: `sudo systemctl start mysql`
2. Create DB + user:

```sql
CREATE DATABASE IF NOT EXISTS novel_nest;
CREATE USER IF NOT EXISTS 'novelnest_user'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON novel_nest.* TO 'novelnest_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 6. Google Drive Integration

1. In Google Cloud Console: create a project → enable **Google Drive API**.
2. Create a **service account** with the **Editor** role and download the JSON key. Save it as `code/google-credentials.json`.
3. In Google Drive: create a folder, share it with the service-account email, and copy the folder ID to `.env`.

> If `google-credentials.json` ever gets committed or shared, revoke the key and create a new one.

---

## 7. Prisma & Database Sync

Run from the `code/` directory:

```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
```

If `generate` keeps failing on Windows, delete `node_modules/.prisma`, run PowerShell as Administrator, and retry after pausing antivirus.

---

## 8. Seed Demo Data (Optional but Recommended)

```bash
npm run seed
```

`code/scripts/seed.js` inserts:
- Four demo users (reader, writer, admin, developer)
- Sample novels, episodes, reviews, wishlist & follow data
- A demo author showcase series
- Local cover art stored under `code/public/pictures` (surfaced as `/pictures/<slug>.jpg`)

Credentials created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Reader | reader@novelnest.dev | Read1234! |
| Writer | writer@novelnest.dev | Write1234! |
| Admin | admin@novelnest.dev | Admin1234! |
| Developer | developer@novelnest.dev | Dev1234! |

---

## 9. Run Novel Nest

```bash
npm run dev
```

- Local URL: http://localhost:3000
- Ignore informational warnings such as `turbopack.root should be absolute` or `middleware convention is deprecated` during local dev.

Production build:

```bash
npm run build
npm start
```

---

## 10. Smoke Test Checklist

1. **Auth:** sign in with each seeded account to confirm role-based redirects (`/author`, `/admin`, etc.).
2. **Author flow:** create/edit novels and chapters, ensure Google Drive receives uploaded content.
3. **Reader flow:** log out, click *Start Reading* → confirm redirect to `/auth/login`; log back in and read chapters.
4. **Engagement widgets:** like, wishlist, follow, leave reviews/comments; inspect `/api/*` responses in DevTools > Network.
5. **Admin capabilities:** as admin/dev, open `/author/novels` and `/author/novels/[id]` to verify global management access.

---

## 11. Troubleshooting Cheatsheet

| Problem | Fix |
| --- | --- |
| `EPERM ... query_engine-windows.dll` | Close Node/VS Code, delete `node_modules/.prisma`, pause antivirus, run PowerShell as Admin, reinstall (`npm install`) then `npx prisma generate`. |
| `P1001: Can't reach database server` | Start MySQL service; verify credentials with `mysql -u user -p novel_nest`; re-run `npx prisma db push`. |
| `npx prisma generate` says schema missing | Run the command from `code/` or pass `--schema prisma/schema.prisma`. |
| Google Drive upload errors | Confirm service account JSON exists, folder ID is correct, and the Drive folder is shared with the service account email. |
| `NEXTAUTH_SECRET` warning | Generate a new secret via `openssl rand -base64 32`, update `.env`, restart `npm run dev`. |
| Port 3000 busy | `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`, or run `npm run dev -- -p 3001`. |

---

## 12. Security Reminders Before Pushing to GitHub

- `.env` and `google-credentials.json` must stay untracked.
- Rotate service-account keys and database passwords if they ever leak.
- Production deployments should use separate `.env` values per environment.

---

## 13. Helpful Commands Reference

```bash
npm run dev                 # start Next.js (Turbopack)
npm run build && npm start  # production build/serve
npm run lint                # run ESLint (flat config)
npm run seed                # seed demo data
npx prisma studio           # GUI for database inspection
npx prisma migrate status   # verify migrations
npx prisma db pull          # introspect live DB (read-only)
```

With the steps above you can reproduce the full Novel Nest stack—Next.js App Router UI, Prisma + MySQL, and Google Drive asset storage—on any machine.
