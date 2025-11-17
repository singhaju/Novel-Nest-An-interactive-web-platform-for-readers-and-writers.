export type UserRole = "reader" | "writer" | "author" | "admin" | "developer" | "superadmin"
export type NovelStatus = "ongoing" | "completed" | "hiatus" | "pending_approval"

export interface Profile {
  id: string
  username: string
  role: UserRole
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Novel {
  id: string
  title: string
  author_id: string
  summary?: string
  cover_url?: string
  status: NovelStatus
  total_views: number
  total_likes: number
  rating: number
  genre?: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Chapter {
  id: string
  novel_id: string
  chapter_number: number
  title: string
  content: string
  is_premium: boolean
  views: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  chapter_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export interface ReadingHistory {
  id: string
  user_id: string
  chapter_id: string
  novel_id: string
  read_at: string
  novel?: Novel
  chapter?: Chapter
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon_url?: string
  created_at: string
}
