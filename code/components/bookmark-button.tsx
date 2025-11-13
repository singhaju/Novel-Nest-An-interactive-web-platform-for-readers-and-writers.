"use client"

import React from "react"

interface BookmarkButtonProps {
	novelId: number
	episodeId: number
	initialBookmarked?: boolean
}

// No-op BookmarkButton: kept to preserve imports but intentionally renders nothing.
// This removes the bookmark UI and its client-side behaviour from the episode page.
export function BookmarkButton(_props: BookmarkButtonProps) {
	return null
}
