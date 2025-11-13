import Link from "next/link"
import AuthWarningLink from "@/components/auth-warning-link"
import { ArrowRight, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CtaBannerProps {
  isAuthenticated: boolean
  role?: string | null
}

export function CtaBanner({ isAuthenticated, role }: CtaBannerProps) {
  const createHref = "/author/novels/create"
  const href = isAuthenticated && (role === "writer" || role === "author") ? createHref : `/auth/login?callbackUrl=${encodeURIComponent(createHref)}`

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 p-10">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-4 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            <PenTool className="h-4 w-4 text-primary" />
            Open submissions
          </div>
          <h2 className="max-w-xl text-2xl font-semibold text-foreground md:text-3xl">
            Share your universe with thousands of readers
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Publish draft chapters, get instant feedback, and collaborate with your team in real time. Our moderation team keeps the community safe so you can focus on storytelling.
          </p>
        </div>
        <Button asChild size="lg" className="w-fit">
          {isAuthenticated && (role === "writer" || role === "author") ? (
            <Link href={href}>
              Start writing today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <AuthWarningLink href={href} className="flex items-center">
              Start writing today
              <ArrowRight className="ml-2 h-4 w-4" />
            </AuthWarningLink>
          )}
        </Button>
      </div>
    </section>
  )
}
