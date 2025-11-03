-- Insert sample badges
INSERT INTO public.badges (name, description, icon_url) VALUES
  ('First Read', 'Read your first chapter', '/badges/first-read.png'),
  ('Bookworm', 'Read 100 chapters', '/badges/bookworm.png'),
  ('Loyal Reader', 'Read for 30 consecutive days', '/badges/loyal-reader.png'),
  ('Supporter', 'Purchase your first premium chapter', '/badges/supporter.png')
ON CONFLICT DO NOTHING;
