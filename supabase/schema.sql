-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Creates tables, RLS, and public read policies for Teder-Yeshar-El
--
-- Storage: create a public bucket named `media` (Dashboard → Storage) so admin
-- cover uploads resolve via getPublicUrl. Add policy allowing authenticated or
-- service uploads as needed for your security model.

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

-- 2. Playlists (many-to-many with videos via playlist_videos)
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Playlist ↔ Video (positions are per-playlist ordering)
CREATE TABLE IF NOT EXISTS public.playlist_videos (
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, video_id)
);

-- If migrating from an older schema with `series` / series_id / episode_number, run manually, e.g.:
-- CREATE TABLE playlists (...); CREATE TABLE playlist_videos (...);
-- ALTER TABLE videos DROP COLUMN IF EXISTS series_id;
-- ALTER TABLE videos DROP COLUMN IF EXISTS episode_number;
-- DROP TABLE IF EXISTS series CASCADE;

-- 5. Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

-- 6. Public read policies (drop first if re-running)
DROP POLICY IF EXISTS "Allow public read-only access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read-only access to playlists" ON public.playlists;
DROP POLICY IF EXISTS "Allow public read-only access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow public read-only access to playlist_videos" ON public.playlist_videos;
CREATE POLICY "Allow public read-only access to categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to playlists"
  ON public.playlists FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to videos"
  ON public.videos FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to playlist_videos"
  ON public.playlist_videos FOR SELECT USING (true);

-- 7. Existing databases: `CREATE TABLE IF NOT EXISTS` does not add new columns.
--    Run if PostgREST reports missing columns in the schema cache.
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
