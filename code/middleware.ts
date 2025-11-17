// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
  const tokenRole = typeof req.nextauth?.token?.role === "string" ? req.nextauth.token.role.toLowerCase() : undefined;

    // Allow public paths (no auth check)
    const isPublicPath =
      pathname === "/" ||
      pathname.startsWith("/novels") ||
      pathname.startsWith("/novel") ||
      pathname.startsWith("/auth");

    if (isPublicPath) {
      return NextResponse.next();
    }

    // Enforce role-based routing for protected sections.
    if (pathname.startsWith("/admin") && !["admin", "superadmin"].includes(tokenRole ?? "")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/developer") && !["developer", "superadmin"].includes(tokenRole ?? "")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const isAuthorPath = pathname.startsWith("/author")
    const allowedAuthorRoles = ["writer", "author", "admin", "developer", "superadmin"]
    const isAuthorCreatePage = pathname.startsWith("/author/novels/create")

    if (isAuthorPath && !allowedAuthorRoles.includes(tokenRole ?? "")) {
      if (isAuthorCreatePage && tokenRole) {
        return NextResponse.next()
      }

      if (!tokenRole) {
        const loginUrl = new URL("/auth/login", req.url)
        loginUrl.searchParams.set("callbackUrl", "/author/novels/create")
        return NextResponse.redirect(loginUrl)
      }

      const upgradeUrl = new URL("/author/novels/create", req.url)
      upgradeUrl.searchParams.set("upgrade", "1")
      return NextResponse.redirect(upgradeUrl)
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only require authentication for non-public routes
      authorized: ({ req, token }) => {
        const publicPaths = ["/", "/novels", "/novel", "/auth"]
        const pathname = req.nextUrl.pathname

        if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
          return true
        }

        return !!token
      },
    },
  }
);

// ✅ Only apply middleware to relevant paths
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|novels|$).*)",
  ],
};

