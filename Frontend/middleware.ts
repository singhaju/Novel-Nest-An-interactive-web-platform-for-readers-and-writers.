import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile with role
  let userRole = "reader"
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile) {
      userRole = profile.role
    }
  }

  const path = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/novel/read"]
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", path)
    return NextResponse.redirect(url)
  }

  // Role-based access control
  if (path.startsWith("/author") && userRole !== "author" && userRole !== "admin" && userRole !== "developer") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (path.startsWith("/admin") && userRole !== "admin" && userRole !== "developer") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (path.startsWith("/developer") && userRole !== "developer") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect to home if already logged in and trying to access auth pages
  if ((path === "/auth/login" || path === "/auth/signup") && user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
