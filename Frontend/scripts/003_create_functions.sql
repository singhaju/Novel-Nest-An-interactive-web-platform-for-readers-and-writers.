-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'reader')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update novel view count
CREATE OR REPLACE FUNCTION public.increment_novel_views(novel_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.novels
  SET total_views = total_views + 1
  WHERE id = novel_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update chapter view count
CREATE OR REPLACE FUNCTION public.increment_chapter_views(chapter_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.chapters
  SET views = views + 1
  WHERE id = chapter_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update novel likes count
CREATE OR REPLACE FUNCTION public.update_novel_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.novels
    SET total_likes = total_likes + 1
    WHERE id = NEW.novel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.novels
    SET total_likes = total_likes - 1
    WHERE id = OLD.novel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update likes count
DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_novel_likes();
