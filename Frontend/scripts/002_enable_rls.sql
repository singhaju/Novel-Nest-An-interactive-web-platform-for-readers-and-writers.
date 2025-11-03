-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Novels policies
CREATE POLICY "Published novels are viewable by everyone" ON public.novels
  FOR SELECT USING (status = 'ongoing' OR status = 'completed' OR status = 'hiatus');

CREATE POLICY "Authors can view their own novels" ON public.novels
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert novels" ON public.novels
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own novels" ON public.novels
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own novels" ON public.novels
  FOR DELETE USING (auth.uid() = author_id);

-- Chapters policies
CREATE POLICY "Chapters of published novels are viewable" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.novels 
      WHERE novels.id = chapters.novel_id 
      AND (novels.status = 'ongoing' OR novels.status = 'completed' OR novels.status = 'hiatus')
    )
  );

CREATE POLICY "Authors can manage own novel chapters" ON public.chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.novels 
      WHERE novels.id = chapters.novel_id 
      AND novels.author_id = auth.uid()
    )
  );

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Reading history policies
CREATE POLICY "Users can view own reading history" ON public.reading_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading history" ON public.reading_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchased episodes policies
CREATE POLICY "Users can view own purchases" ON public.purchased_episodes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.purchased_episodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- Wishlists policies
CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- Badges policies
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);
