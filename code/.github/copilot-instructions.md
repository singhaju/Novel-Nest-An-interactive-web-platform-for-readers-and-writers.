### Brief goal
Help contributors implement features and fix bugs in Novel Nest — a Next.js 13 (App Router) fullstack app that uses mysql2-backed repositories, server and client components, and REST-style API routes under `app/api`.

### High-level architecture (what to know fast)
- Next.js 13 App Router is used (server components by default). Look in `app/` for route segments and API routes at `app/api/*/route.ts` (e.g. `app/api/episodes/route.ts`).
- Database access goes through `lib/db.ts` (mysql2 pool helpers) plus repository modules in `lib/repositories`. Keep queries parameterized and reuse the shared helpers.
- API endpoints are plain Next API route handlers under `app/api`. The frontend uses a thin `lib/api-client.ts` that issues fetch requests to `/api/*` (baseUrl uses `process.env.NEXTAUTH_URL` or `http://localhost:3000`). Use that client for examples of request/response shapes.
- Authentication: NextAuth/@auth and some Supabase packages are present; session provider is connected in `components/session-provider.tsx` and wrapped in `app/layout.tsx`.

### Key patterns and conventions
- Server components by default: add "use client" at the top of files that use hooks, state, or browser-only APIs.
- API client uses FormData for endpoints that accept files (see `apiClient.createNovel` and `apiClient.createEpisode`) and JSON for simple payloads (e.g. reviews, comments).
- Repository usage: import the needed helper (e.g., `getNovelDetail`) from `lib/repositories/*` or add a new helper there. Avoid issuing raw queries elsewhere so we keep a single data-access layer.
- Error handling: many client helpers throw a generic Error if response.ok is false. When adding API routes, return meaningful HTTP status codes and JSON bodies to help the frontend surface messages.
- Images: `next.config.mjs` sets images.unoptimized = true; do not assume Next Image optimization in local dev.

### Important files to reference when coding
- `app/` — top-level app routes and API routes.
- `components/` and `components/ui/` — shared UI primitives and atomic components.
- `lib/api-client.ts` — canonical request shapes and examples for novels, episodes, comments, reviews, wishlist, follows, reading-progress.
- `lib/db.ts` — mysql2 pool + helpers (`query`, `queryOne`, `execute`).
- `lib/repositories/*` — domain-specific query helpers (novels, episodes, stats, etc.).
- `google-credentials.json` — present at repo root; used by `lib/google-drive.ts` if uploading assets.
- `package.json` — scripts you can run: `pnpm dev`, `pnpm build` (Next build only), plus `pnpm seed` for DB bootstrapping.

### Environment variables & local dev notes
- Required/used env vars: DATABASE_URL, NEXTAUTH_URL (used by api-client), and credentials for Google Drive if you interact with `lib/google-drive.ts`.
- `lib/api-client.ts` falls back to `http://localhost:3000` if `NEXTAUTH_URL` is not set — set `NEXTAUTH_URL=http://localhost:3000` when running from the browser to match fetch targets.

### How API routes expect data (concrete examples)
- Creating a novel/episode: frontend sends a FormData POST to `/api/novels` or `/api/episodes` (see `apiClient.createNovel` / `createEpisode`). Implement server handlers to accept `multipart/form-data` or `form-data` fields.
- Creating reviews/comments: POST JSON to `/api/reviews` or `/api/comments` with `Content-Type: application/json` (see `apiClient.createReview` and `createComment`).

### Quick debugging checklist
- If server-side DB code fails, check `lib/db.ts` usage and ensure `DATABASE_URL` is set (mysql connection string).
- For client-to-API failures, verify `NEXTAUTH_URL` or that you call the proper `/api/*` path; inspect network requests in browser devtools.
- If TypeScript or ESLint build errors block you, note `next.config.mjs` currently ignores TypeScript and ESLint build errors. Fixes are still recommended even though the build won't fail.

### Minimal contract when changing an API route
- Input: describe expected body/query params (use `lib/api-client.ts` as the canonical source).
- Output: return JSON with an explicit status and helpful message on error (HTTP 4xx/5xx). Keep shapes consistent with `api-client` expectations.

### Example references to copy from
- `lib/api-client.ts` — request shapes and endpoints (novels, episodes, comments, reviews, wishlist).
- `lib/db.ts` + `lib/repositories/*` — mysql2 helpers and query patterns to copy.
- `app/layout.tsx` — where SessionProvider and analytics are wired; use this when changing auth/session concerns.
- `next.config.mjs` — image and build-related overrides (eslint/typescript ignored at build time).

If anything here is unclear or you'd like more examples (e.g., a template API route or test harness), tell me which area to expand and I will update this instruction file.
