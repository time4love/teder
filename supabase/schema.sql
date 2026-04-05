-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Creates tables, RLS, and public read policies for Teder-Yeshar-El

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

-- 2. Series
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT
);

-- 3. Videos
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  episode_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- 5. Public read policies (drop first if re-running)
DROP POLICY IF EXISTS "Allow public read-only access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read-only access to series" ON public.series;
DROP POLICY IF EXISTS "Allow public read-only access to videos" ON public.videos;

CREATE POLICY "Allow public read-only access to categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to series"
  ON public.series FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to videos"
  ON public.videos FOR SELECT USING (true);
