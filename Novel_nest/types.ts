
export enum UserRole {
  READER = 'Reader',
  WRITER = 'Writer',
  ADMIN = 'Admin',
  DEVELOPER = 'Developer',
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  role: UserRole;
  created_at: string;
}

export interface Novel {
  novel_id: number;
  title: string;
  description: string;
  cover_image: string;
  tags: string[];
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  last_update: string;
  views: number;
  likes: number;
  rating: number;
  author: Pick<User, 'user_id' | 'username'>;
}

export interface Episode {
  episode_id: number;
  novel_id: number;
  title: string;
  content: string; // URL or full text
  is_locked: boolean;
  price: number;
  release_date: string;
}

export interface Review {
  review_id: number;
  novel_id: number;
  user: Pick<User, 'user_id' | 'username' | 'profile_picture'>;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Comment {
  comment_id: number;
  episode_id: number;
  user: Pick<User, 'user_id' | 'username' | 'profile_picture'>;
  parent_comment_id?: number;
  content: string;
  created_at: string;
  replies?: Comment[];
}
