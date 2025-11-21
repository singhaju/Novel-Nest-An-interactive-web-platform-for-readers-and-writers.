# Professor Setup Checklist

Use this checklist to verify the Novel Nest project runs exactly as on the student machine. Each task builds on the previous one, so work from top to bottom.

## 1. Pre-flight Requirements
- [ ] Install **Node.js 20.x** (LTS). Verify with `node -v`.
- [ ] Install **pnpm 9.x** globally (`npm install -g pnpm`). Verify with `pnpm -v`.
- [ ] Install **MySQL 8.x** (or compatible). Ensure you can sign in with an account that can create databases.
- [ ] Install **Git** and confirm `git --version` works.
- [ ] Enable **Google Cloud service account** access to the provided Drive folder: `1zwkV2zevwIM4TsVyghUYDe_AVeT0vjgu`. Download its JSON key (named `google-credentials.json`).
- [ ] (Optional) Have a Supabase project ready if you plan to exercise the Supabase-powered features; otherwise you may skip those modules.

## 2. Download the Repository
- [ ] Choose a working directory with at least 5 GB free space.
- download the ZIP and cd into /code after extracting
  ```
- [ ] Check out the submission branch:
  ```bash
  cd Novel-nest/code
  ```
- [ ] All student work lives in the `code/` directory;

## 3. Environment Configuration
- [ ] In the repo root, copy the provided sample env file if needed:
  ```bash
  cd code
  cp .env .env.local   # adjust if you prefer to edit .env directly
  ```
- [ ] Open the env file and review these required keys:
  | Purpose | Variable |
  | --- | --- |
  | MySQL connection string | `DATABASE_URL` (e.g., `mysql://user:pass@localhost:3306/novel_nest`) |
  | NextAuth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
  | Google OAuth (NextAuth provider) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
  | Password hardening (optional but recommended) | `PASSWORD_PEPPER`, `PASSWORD_SALT_BYTES` |
  | Supabase (reader analytics, comments) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
  | Google Drive uploads | `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_DRIVE_UPLOAD_FOLDER_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_DRIVE_COVERS_FOLDER_ID` |
  | Google Drive OAuth helper scripts | `GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` |
  | Public site URL helpers | `NEXT_PUBLIC_BASE_URL` |
- [ ] Place the downloaded `google-credentials.json` inside `code/` (or update `GOOGLE_APPLICATION_CREDENTIALS` to point wherever you store it).
- [ ] Ensure the Google Drive service account email has **Editor** access to the folder `1zwkV2zevwIM4TsVyghUYDe_AVeT0vjgu` so avatar uploads work.

## 4. Install Dependencies
- [ ] Still inside `code/`, install packages (this also triggers the `postinstall` hook defined in `package.json`):
  ```bash
  pnpm install
  ```

## 5. Database Preparation
- [ ] Start MySQL (`mysql.server start` on macOS or your preferred service manager).
- [ ] Create the target database if it doesn't exist:
  ```sql
  CREATE DATABASE IF NOT EXISTS novel_nest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- [ ] Confirm `DATABASE_URL` points to that database and user has full privileges.
- [ ] Seed baseline data:
  ```bash
  pnpm seed
  ```
  This script runs `scripts/seed.js` and populates sample users, novels, episodes, etc.

## 6. Google Drive Upload Test (Optional but Recommended)
- [ ] Ensure the service account file path in `.env` is correct.
- [ ] Run a quick upload smoke test:
  ```bash
  pnpm tsx scripts/sync-drive-covers.ts
  ```
  or simply start the dev server and upload a profile image. Success should produce a publicly accessible Drive URL.

## 7. Run the Application Locally
- [ ] Start the development server:
  ```bash
  pnpm dev
  ```
- [ ] Open http://localhost:3000 in a browser.
- [ ] Sign in with any user from the seeded data (see `scripts/seed.js` for sample emails/passwords) or use the credentials provided by the student.
- [ ] Navigate to **Profile** and verify uploading a profile photo stores the image in Google Drive (watch the terminal for `Upload` logs).

## 8. (Optional) Production Build Verification
- [ ] Run the production build to ensure nothing relies on dev-only behavior:
  ```bash
  pnpm build
  pnpm start
  ```
- [ ] Re-test critical flows (login, browse novels, upload avatar) on the production server.

## 9. Common Troubleshooting Steps
- [ ] If MySQL connection fails, re-check `DATABASE_URL` formatting and that the account has privileges.
- [ ] If Google uploads fail, verify the `google-credentials.json` file path and folder permissions; the server log will echo `Failed to upload file to Google Drive` if credentials are wrong.
- [ ] If Supabase features throw errors and you do not plan to test them, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to dummy values or comment out Supabase-dependent components.
- [ ] When switching machines, delete `.next/` to avoid stale Turbopack artifacts (`rm -rf .next`).

Following this checklist will mirrors the student's development environment.
