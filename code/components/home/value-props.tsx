import { BookOpenCheck, Lock, Users } from "lucide-react"

const items = [
  {
    title: "Read without limits",
    description: "All chapters stay free to access so you can binge entire sagas without paywalls or tokens.",
    icon: BookOpenCheck,
  },
  {
    title: "Creator-first security",
    description: "Your drafts and uploads are protected with secure storage, access controls, and regular backups.",
    icon: Lock,
  },
  {
    title: "Communities that grow",
    description: "Follow authors, collect series on wishlists, and track progress across every device.",
    icon: Users,
  },
]

export function ValueProps() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
          <item.icon className="mb-4 h-10 w-10 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
        </div>
      ))}
    </section>
  )
}
