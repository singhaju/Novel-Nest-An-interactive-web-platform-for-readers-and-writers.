/**
 * API Client for Novel Nest Backend
 * Replaces Supabase client calls with fetch to our Next.js API routes
 */

// ✅ Define a reusable base URL
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

export interface Novel {
  novel_id: number
  title: string
  description?: string
  cover_image?: string
  tags?: string
  status: string
  views: number
  likes: number
  rating: number
  author: {
    user_id: number
    username: string
    profile_picture?: string
  }
  _count?: {
    episodes: number
    reviews: number
  }
}

export interface Episode {
  episode_id: number
  novel_id: number
  title: string
  content: string
  contentText?: string
  release_date: string
}

export interface Review {
  review_id: number
  novel_id: number
  user_id: number
  rating: number
  comment?: string
  created_at: string
  user: {
    user_id: number
    username: string
    profile_picture?: string
  }
}

export interface Comment {
  comment_id: number
  episode_id: number
  user_id: number
  content: string
  created_at: string
  user: {
    user_id: number
    username: string
    profile_picture?: string
  }
  replies?: Comment[]
}

export const apiClient = {
  // ✅ Novels
  async getNovels(params?: {
    status?: string
    genre?: string
    authorId?: number
    limit?: number
    offset?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.genre) searchParams.set("genre", params.genre)
    if (params?.authorId) searchParams.set("authorId", params.authorId.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.offset) searchParams.set("offset", params.offset.toString())

    const res = await fetch(`${baseUrl}/api/novels?${searchParams}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch novels")
    const data = await res.json()
    // API returns { novels, total, limit, offset }
    return { novels: data.novels ?? [], total: data.total, limit: data.limit, offset: data.offset }
  },

  async getNovel(id: number) {
    const res = await fetch(`${baseUrl}/api/novels/${id}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch novel")
    return res.json()
  },

  async createNovel(formData: FormData) {
    const res = await fetch(`${baseUrl}/api/novels`, { method: "POST", body: formData })
    if (!res.ok) throw new Error("Failed to create novel")
    return res.json()
  },

  async updateNovel(id: number, data: any) {
    const res = await fetch(`${baseUrl}/api/novels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update novel")
    return res.json()
  },

  async deleteNovel(id: number) {
    const res = await fetch(`${baseUrl}/api/novels/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete novel")
    return res.json()
  },

  // ✅ Episodes
  async createEpisode(formData: FormData) {
    const res = await fetch(`${baseUrl}/api/episodes`, { method: "POST", body: formData })
    if (!res.ok) throw new Error("Failed to create episode")
    return res.json()
  },

  async getEpisode(id: number) {
    const res = await fetch(`${baseUrl}/api/episodes/${id}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch episode")
    return res.json()
  },

  // ✅ Reviews
  async createReview(data: { novelId: number; rating: number; comment?: string }) {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create review")
    return res.json()
  },

  // ✅ Comments
  async getComments(episodeId: number) {
    const res = await fetch(`${baseUrl}/api/comments?episodeId=${episodeId}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch comments")
    return res.json()
  },

  async createComment(data: { episodeId: number; content: string; parentCommentId?: number }) {
    const res = await fetch(`${baseUrl}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create comment")
    return res.json()
  },

  // ✅ Wishlist
  async getWishlist() {
    const res = await fetch(`${baseUrl}/api/wishlist`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch wishlist")
    return res.json()
  },

  async toggleWishlist(novelId: number) {
    const res = await fetch(`${baseUrl}/api/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelId }),
    })
    if (!res.ok) throw new Error("Failed to toggle wishlist")
    return res.json()
  },

  // ✅ Follows
  async toggleFollow(authorId: number) {
    const res = await fetch(`${baseUrl}/api/follows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId }),
    })
    if (!res.ok) throw new Error("Failed to toggle follow")
    return res.json()
  },

  // ✅ Reading Progress
  async updateReadingProgress(data: { novelId: number; episodeId: number }) {
    const res = await fetch(`${baseUrl}/api/reading-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to update reading progress")
    return res.json()
  },
    
  async checkFollow(authorId: number) {
    const res = await fetch(`${baseUrl}/api/follows?authorId=${authorId}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to check follow status")
    return res.json()
  }
}
