import { CategoryPills } from "@/components/feed/CategoryPills";
import { VideoFeed } from "@/components/feed/VideoFeed";
import type { Category, Series, Video } from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import { groupVideosForFeed } from "@/utils/feed";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const [{ data: categoriesData, error: categoriesError }, { data: seriesData, error: seriesError }, { data: videosData, error: videosError }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("series").select("*"),
      supabase.from("videos").select("*").order("created_at", { ascending: true }),
    ]);

  if (categoriesError !== null) {
    console.error("[page] categories", categoriesError.message);
  }
  if (seriesError !== null) {
    console.error("[page] series", seriesError.message);
  }
  if (videosError !== null) {
    console.error("[page] videos", videosError.message);
  }

  const categories = (categoriesData ?? []) as Category[];
  const videosRaw = (videosData ?? []) as Video[];
  const seriesList = (seriesData ?? []) as Series[];

  const categorySlug = firstParam(searchParams.category);

  let videos: Video[] = videosRaw;
  if (categorySlug !== undefined && categorySlug !== "") {
    const match = categories.find((c) => c.slug === categorySlug);
    if (match !== undefined) {
      videos = videosRaw.filter((v) => v.category_id === match.id);
    } else {
      videos = [];
    }
  }

  const rows = groupVideosForFeed(videos);

  const seriesTitles: Record<string, string> = {};
  for (const s of seriesList) {
    seriesTitles[s.id] = s.title;
  }

  const activeSlug =
    categorySlug !== undefined && categorySlug !== "" ? categorySlug : undefined;

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-black text-white">
      <CategoryPills categories={categories} activeSlug={activeSlug} />
      <VideoFeed rows={rows} seriesTitles={seriesTitles} />
    </div>
  );
}
