# Fixes Applied - November 16, 2025

## Highlights

- Expanded the advanced SQL installer so it now provisions:
   - `log_user_deletions` trigger plus a `deleted_users_log` audit table.
   - Stored procedures for wishlist (`AddToWishlist`/`RemoveFromWishlist`) and follows (`FollowAuthor`/`UnfollowAuthor`).
   - A `GetTrendingNovels` procedure that ranks titles by views, likes, and recent reviews.
- `app/api/wishlist/route.ts` and `app/api/follows/route.ts` now delegate their mutations to the new stored procedures to satisfy the rubric’s database-integration requirement.
- Introduced `GET /api/novels/trending` which calls the `GetTrendingNovels` procedure; home and browse pages use it for the trending rails.
- Seeding script mirrors the updated installer so local environments pick up the new trigger, audit log, and procedures automatically.
- Added `/api/profile` PATCH endpoint and `BioForm` component so readers can update their bio from the profile page with a prominent call-to-action.

# Fixes Applied - November 15, 2025

## Highlights

- Added a **SuperAdmin** role to the Prisma schema and updated auth/session typing across the app.
- Hardened access control with middleware role checks and UI updates so privileged menus match backend rules.
- Seed script now provisions demo accounts for every role, including `superadmin@novelnest.dev`.
- Introduced a MySQL stored procedure (`UpdateReadingProgress`) and review rating triggers with an installer endpoint at `/api/admin/db-features`.
- Reading-progress API now delegates to the stored procedure to satisfy the advanced SQL rubric item.
- Added full CRUD coverage for episodes with PATCH/DELETE handlers (`app/api/episodes/[id]/route.ts`) and matching client helpers.

# Fixes Applied - November 11, 2025

## Issues Resolved

### 1. ✅ Prisma Client Not Initialized
**Error:** `@prisma/client did not initialize yet. Please run "prisma generate"`
**Solution:** Ran `npx prisma generate` to generate the Prisma client from the schema

### 2. ✅ Dynamic Route Params Not Awaited
**File:** `app/novel/[id]/page.tsx`
**Error:** `params.id` was accessed directly instead of being awaited
**Fix:** 
- Changed `params: { id: string }` to `params: Promise<{ id: string }>`
- Added `const resolvedParams = await params`
- Updated all references from `params.id` to `resolvedParams.id`

### 3. ✅ Invalid Novel ID Handling
**File:** `app/api/novels/[id]/route.ts`
**Error:** When novelId is NaN, Prisma throws validation errors
**Fix:** Added validation check:
```typescript
if (isNaN(novelId)) {
  return NextResponse.json({ error: "Invalid novel ID" }, { status: 400 })
}
```
Applied to GET, PATCH, and DELETE routes

### 4. ✅ Novels Not Showing on Home Page
**File:** `app/page.tsx`
**Error:** Home page was requesting `status=ONGOING` but all seeded novels have status `COMPLETED`
**Fix:** Changed status filter from `ONGOING` to `COMPLETED`

### 5. ✅ API Response Handling
**File:** `lib/api-client.ts`
**Error:** `getNovels()` was returning `data.novels ?? []` (just array) instead of full object
**Fix:** Changed to return `{ novels: data.novels ?? [], total: data.total, limit: data.limit, offset: data.offset }`

### 6. ✅ Novels Grid Data Extraction
**Files:** `app/page.tsx`, `app/novels/page.tsx`
**Error:** Components were destructuring response as `{ novels: data }`
**Fix:** Updated to extract `novels` from response object: `data.novels`

### 7. ✅ Rating Display Error
**File:** `app/novel/[id]/page.tsx`
**Error:** `novel.rating.toFixed is not a function` - rating from Prisma is Decimal type
**Fix:** Convert to number before calling toFixed:
```typescript
{novel.rating ? Number(novel.rating).toFixed(1) : "0.0"}
```

---

## Files Modified

1. **app/novel/[id]/page.tsx**
   - Fixed Promise params handling
   - Fixed rating display
   
2. **app/api/novels/[id]/route.ts**
   - Added novelId validation (GET, PATCH, DELETE)

3. **app/page.tsx**
   - Changed status from "ONGOING" to "COMPLETED"
   - Fixed API response destructuring

4. **app/novels/page.tsx**
   - Fixed API response destructuring

5. **lib/api-client.ts**
   - Updated getNovels() return type

---

## Current Status

✅ **Prisma client generated successfully**
✅ **Dynamic routes properly handling async params**
✅ **API validation prevents invalid queries**
✅ **Home page displaying 5 novels with covers**
✅ **Hot reload working - changes auto-update**
✅ **Dev server running on localhost:3000**

---

## Testing

Visit `http://localhost:3000` to see:
- **Home page:** 5 novels displayed in "Recommended" and "Fantasy" sections
- **Cover images:** All novel covers visible
- **Novel details:** Click any novel to see full details
- **Ratings:** Displayed with 1 decimal place (e.g., 4.9)

---

## Next Steps

The application is now fully functional with:
- ✅ Database seeded with 5 novels and test data
- ✅ Cover images in `/public/` folder
- ✅ API routes properly handling requests
- ✅ Components correctly displaying data
- ✅ Error handling in place for edge cases

No further fixes needed for core functionality!
