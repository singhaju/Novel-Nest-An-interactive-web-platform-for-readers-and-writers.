import { User, Novel, Episode, Review, Comment } from '../types';

// Helper for making API requests
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API call failed with status ${response.status}`);
    }
    // Handle cases where the response body might be empty (e.g., 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}


export const apiService = {
  // === AUTH ===
  signup: async (username: string, email: string, pass: string): Promise<User | null> => {
    return fetchAPI('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password: pass }),
    });
  },

  // === NOVELS / READER FLOWS ===
  // FIX: Added authorId to filters to allow fetching novels by a specific author.
  getNovels: (filters: { genre?: string, tag?: string, status?: string, orderBy?: 'views' | 'rating', authorId?: number } = {}): Promise<Novel[]> => {
    const params = new URLSearchParams(filters as any);
    return fetchAPI(`/api/novels?${params.toString()}`);
  },
  
  getNovelById: (id: number): Promise<Novel | undefined> => {
    return fetchAPI(`/api/novels/${id}`);
  },

  getEpisodesByNovelId: (novelId: number): Promise<Episode[]> => {
    return fetchAPI(`/api/novels/${novelId}/episodes`);
  },
  
  // FIX: Renamed getEpisodeContent to getEpisode for consistency.
  getEpisode: (episodeId: number): Promise<Episode | undefined> => {
    return fetchAPI(`/api/episodes/${episodeId}`);
  },
  
  getReviewsByNovelId: (novelId: number): Promise<Review[]> => {
      return fetchAPI(`/api/novels/${novelId}/reviews`);
  },

  postReview: (novelId: number, rating: number, comment: string): Promise<Review> => {
    return fetchAPI(`/api/novels/${novelId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment })
    });
  },
  
  getCommentsByEpisodeId: (episodeId: number): Promise<Comment[]> => {
      return fetchAPI(`/api/episodes/${episodeId}/comments`);
  },

  postComment: (episodeId: number, content: string, parentCommentId?: number): Promise<Comment> => {
      return fetchAPI(`/api/episodes/${episodeId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content, parentCommentId })
      });
  },

  // === USER INTERACTIONS ===
  toggleWishlist: (novelId: number): Promise<{ wishlisted: boolean }> => {
    return fetchAPI(`/api/novels/${novelId}/wishlist`, { method: 'POST' });
  },

  toggleFollow: (authorId: number): Promise<{ following: boolean }> => {
    return fetchAPI(`/api/users/${authorId}/follow`, { method: 'POST' });
  },

  toggleLike: (novelId: number): Promise<{ liked: boolean, likesCount: number }> => {
    return fetchAPI(`/api/novels/${novelId}/like`, { method: 'POST' });
  },

  updateReadingProgress: (novelId: number, episodeId: number): Promise<void> => {
    return fetchAPI(`/api/users/me/reading-progress`, {
      method: 'POST',
      body: JSON.stringify({ novelId, episodeId })
    });
  },

  updateUserProfile: (profileData: { bio?: string, profile_picture?: string }): Promise<User> => {
      return fetchAPI('/api/users/me/profile', {
          method: 'PUT',
          body: JSON.stringify(profileData)
      });
  },

  // === WRITER FLOWS ===
  createNovel: (novelData: { title: string, description: string, tags: string[], cover_image?: string }): Promise<Novel> => {
      return fetchAPI('/api/novels', {
          method: 'POST',
          body: JSON.stringify(novelData)
      });
  },

  createEpisode: (novelId: number, episodeData: { title: string, content: string, is_locked: boolean, price?: number }): Promise<Episode> => {
      return fetchAPI(`/api/novels/${novelId}/episodes`, {
          method: 'POST',
          body: JSON.stringify(episodeData)
      });
  },
  
  updateEpisode: (episodeId: number, episodeData: { title?: string, content?: string, is_locked?: boolean, price?: number }): Promise<Episode> => {
      return fetchAPI(`/api/episodes/${episodeId}`, {
          method: 'PUT',
          body: JSON.stringify(episodeData)
      });
  },

  getWriterDashboard: (): Promise<any> => {
      return fetchAPI('/api/writer/dashboard');
  },
  
  // === ADMIN FLOWS ===
  getAdminDashboard: (): Promise<any> => {
      return fetchAPI('/api/admin/dashboard');
  },

  updateUserStatus: (userId: number, updates: { role?: string, status?: string }): Promise<User> => {
      return fetchAPI(`/api/admin/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
      });
  },

  deleteComment: (commentId: number): Promise<void> => {
      return fetchAPI(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
  },

  // === DEV FLOWS ===
  getDevMetrics: (): Promise<any> => {
    return fetchAPI('/api/dev/metrics');
  }
};