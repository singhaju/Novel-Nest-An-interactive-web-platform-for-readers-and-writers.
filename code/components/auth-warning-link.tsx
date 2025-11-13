"use client"

import React from "react"
import { useRouter } from "next/navigation"

interface AuthWarningLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  message?: string
}

export default function AuthWarningLink({ href, children, className, message = "please log-in as an author" }: AuthWarningLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // If the link goes to the login flow, show a warning first
    if (href.includes("/auth/login")) {
      // simple browser alert as the requested "warning pop up"
      // can be replaced later with a nicer modal component
      window.alert(message)
      router.push(href)
      return
    }

    // default navigation for other links
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
