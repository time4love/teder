"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  addVideoAction,
  createCategoryAction,
  createPlaylistAction,
  fetchYouTubeMetadata,
  updateVideoAction,
} from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  adminVideoFormSchema,
  type AdminVideoFormValues,
} from "@/lib/validations/admin-video";
import type { Category, Playlist, VideoWithPlaylists } from "@/types/database";

export interface VideoFormProps {
  categories: Category[];
  playlists: Playlist[];
  /** When set, edit mode; include `playlist_ids` from `playlist_videos`. */
  initialData?: VideoWithPlaylists;
  /**
   * When creating a video, pre-select this playlist (e.g. `?playlist_id=` from
   * the playlist edit screen).
   */
  defaultPlaylistId?: string | null;
}

const PLAYLIST_ID_PARAM_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function VideoForm({
  categories,
  playlists,
  initialData,
  defaultPlaylistId,
}: VideoFormProps) {
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(
    categories ?? [],
  );
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>(
    playlists ?? [],
  );
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const isEditMode = initialData !== undefined;
  const router = useRouter();

  useEffect(() => {
    setLocalCategories(categories ?? []);
  }, [categories]);

  useEffect(() => {
    setLocalPlaylists(playlists ?? []);
  }, [playlists]);

  const categoriesList = useMemo(
    () =>
      localCategories.length > 0 ? localCategories : (categories ?? []),
    [localCategories, categories],
  );
  const playlistsList = useMemo(
    () => (localPlaylists.length > 0 ? localPlaylists : (playlists ?? [])),
    [localPlaylists, playlists],
  );

  const defaultValues = useMemo<AdminVideoFormValues>(() => {
    let playlist_ids: string[] = [];
    if (initialData !== undefined && Array.isArray(initialData.playlist_ids)) {
      playlist_ids = [...initialData.playlist_ids];
    } else if (
      defaultPlaylistId !== undefined &&
      defaultPlaylistId !== null &&
      defaultPlaylistId !== "" &&
      PLAYLIST_ID_PARAM_RE.test(defaultPlaylistId)
    ) {
      playlist_ids = [defaultPlaylistId];
    }
    return {
      youtube_url: initialData?.youtube_url ?? "",
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      category_id: initialData?.category_id ?? "",
      playlist_ids,
      cover_image_url: initialData?.cover_image_url ?? "",
      sort_order:
        initialData !== undefined ? String(initialData.sort_order) : "0",
    };
  }, [initialData, defaultPlaylistId]);

  const form = useForm<AdminVideoFormValues>({
    resolver: zodResolver(adminVideoFormSchema),
    defaultValues,
  });

  async function onSubmit(values: AdminVideoFormValues): Promise<void> {
    const fd = new FormData();
    fd.append("youtube_url", values.youtube_url);
    fd.append("title", values.title);
    fd.append("description", values.description ?? "");
    fd.append("category_id", values.category_id);
    for (const pid of values.playlist_ids) {
      fd.append("playlist_ids", pid);
    }
    if (coverFile !== null) {
      fd.append("cover_image_file", coverFile);
    }
    fd.append("cover_image_url", values.cover_image_url ?? "");
    fd.append("sort_order", values.sort_order ?? "");

    if (isEditMode && initialData !== undefined) {
      const result = await updateVideoAction(initialData.id, fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("הסרטון עודכן בהצלחה");
      router.push("/admin/playlists");
      return;
    }

    const result = await addVideoAction(fd);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("הסרטון נוסף בהצלחה");
    if (
      defaultPlaylistId !== undefined &&
      defaultPlaylistId !== null &&
      defaultPlaylistId !== "" &&
      PLAYLIST_ID_PARAM_RE.test(defaultPlaylistId)
    ) {
      router.push(`/admin/playlists/${defaultPlaylistId}/edit`);
    } else {
      router.push("/admin/playlists");
    }
  }

  async function handleFetchMetadata(): Promise<void> {
    const raw = form.getValues("youtube_url").trim();
    if (raw === "") {
      toast.error("נא להזין כתובת YouTube");
      return;
    }

    setIsFetchingMeta(true);
    try {
      const result = await fetchYouTubeMetadata(raw);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      form.setValue("title", result.title, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("description", result.description, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("הנתונים נטענו מהסרטון");
    } catch {
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setIsFetchingMeta(false);
    }
  }

  async function handleCreateCategory(name: string): Promise<void> {
    setIsCreatingCategory(true);
    try {
      const result = await createCategoryAction(name);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const newCat: Category = {
        id: result.id,
        name: result.name,
        slug: result.slug,
        sort_order: 0,
      };
      setLocalCategories((prev) => [...prev, newCat]);
      form.setValue("category_id", result.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setNewCategoryName("");
      setShowNewCatInput(false);
      toast.success("הקטגוריה נוצרה");
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function handleCreatePlaylistByName(name: string): Promise<void> {
    const title = name.trim();
    if (title === "") {
      toast.error("נא להזין שם פלייליסט");
      return;
    }
    setIsCreatingPlaylist(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", "");
      fd.append("cover_image_url", "");
      fd.append("sort_order", "0");
      const result = await createPlaylistAction(fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const pl: Playlist = {
        id: result.id,
        title: result.title,
        description: result.description,
        sort_order: result.sort_order,
        cover_image_url: result.cover_image_url,
      };
      setLocalPlaylists((prev) =>
        [...prev, pl].sort((a, b) => a.title.localeCompare(b.title, "he")),
      );
      const cur = form.getValues("playlist_ids");
      if (!cur.includes(result.id)) {
        form.setValue("playlist_ids", [...cur, result.id], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      setNewPlaylistTitle("");
      setShowNewPlaylistInput(false);
      toast.success("הפלייליסט נוצר");
    } finally {
      setIsCreatingPlaylist(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        dir="rtl"
      >
        <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <FormField
            control={form.control}
            name="youtube_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">כתובת YouTube</FormLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={cn(
                        "min-w-0 flex-1 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isFetchingMeta}
                    onClick={() => {
                      void handleFetchMetadata();
                    }}
                    className="h-8 shrink-0 gap-1.5 border border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  >
                    <Wand2
                      className="size-4 shrink-0"
                      aria-hidden
                    />
                    {isFetchingMeta ? "טוען..." : "משוך נתונים"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">כותרת</FormLabel>
                <FormControl>
                  <Input
                    placeholder="כותרת הסרטון"
                    className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">תיאור (אופציונלי)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="תיאור קצר..."
                    rows={4}
                    className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-zinc-900">קטגוריה</FormLabel>
                <div className="flex flex-row gap-2">
                  <FormControl className="min-w-0 flex-1">
                    {categoriesList.length === 0 ? (
                      <div className="flex h-10 items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600">
                        אין קטגוריות — לחצו + ליצירה
                      </div>
                    ) : (
                      <Select
                        value={field.value || undefined}
                        onValueChange={(v) => {
                          field.onChange(v);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
                            !field.value && "text-zinc-500",
                          )}
                        >
                          <SelectValue placeholder="בחר קטגוריה">
                            {(value: string | null) => {
                              if (value == null || value === "") {
                                return "בחר קטגוריה";
                              }
                              const cat = categoriesList.find((c) => c.id === value);
                              return cat?.name ?? value;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          dir="rtl"
                          className="border-zinc-200 bg-white"
                        >
                          {categoriesList.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 shrink-0 border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                    aria-label="קטגוריה חדשה"
                    onClick={() => {
                      setShowNewCatInput((open) => !open);
                    }}
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
                {showNewCatInput ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                      }}
                      placeholder="שם קטגוריה חדשה"
                      className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isCreatingCategory}
                      className="shrink-0 border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      onClick={() => {
                        void handleCreateCategory(newCategoryName.trim());
                      }}
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      שמירה
                    </Button>
                  </div>
                ) : null}
                <FormDescription className="text-zinc-500">
                  בחרו מהרשימה או לחצו + ליצירת קטגוריה
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="playlist_ids"
            render={({ field }) => {
              const selectedIds = field.value;

              function togglePlaylistId(id: string): void {
                const cur = field.value;
                if (cur.includes(id)) {
                  field.onChange(cur.filter((x) => x !== id));
                } else {
                  field.onChange([...cur, id]);
                }
              }

              return (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel className="text-zinc-900">פלייליסטים</FormLabel>
                  <div className="flex min-h-[2.5rem] flex-wrap gap-2 rounded-lg border border-zinc-200 bg-zinc-50/90 p-3">
                    {playlistsList.length === 0 ? (
                      <span className="text-sm text-zinc-500">
                        אין פלייליסטים — צרו חדש למטה
                      </span>
                    ) : (
                      playlistsList.map((p) => (
                        <Badge
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          variant={
                            selectedIds.includes(p.id) ? "default" : "outline"
                          }
                          className="cursor-pointer py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-zinc-500"
                          onClick={() => {
                            togglePlaylistId(p.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              togglePlaylistId(p.id);
                            }
                          }}
                        >
                          {p.title}
                        </Badge>
                      ))
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="inline-flex w-fit items-center gap-1.5 border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100"
                    onClick={() => {
                      setShowNewPlaylistInput((open) => !open);
                    }}
                  >
                    <Plus className="size-4 shrink-0" aria-hidden />
                    צור פלייליסט חדש
                  </Button>
                  {showNewPlaylistInput ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={newPlaylistTitle}
                        onChange={(e) => {
                          setNewPlaylistTitle(e.target.value);
                        }}
                        placeholder="שם פלייליסט חדש"
                        className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                        dir="rtl"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isCreatingPlaylist}
                        className="shrink-0 border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        onClick={() => {
                          void handleCreatePlaylistByName(newPlaylistTitle);
                        }}
                      >
                        {isCreatingPlaylist ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : null}
                        שמירה
                      </Button>
                    </div>
                  ) : null}
                  <FormDescription className="text-zinc-500">
                    לחיצה על תג בוחרת או מבטלת. ניתן ליצור פלייליסט חדש למטה.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">סדר הופעה</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500">
                  מספר נמוך יותר מופיע קודם בפיד (ברירת מחדל: 0)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">
                  תמונת כיסוי (אופציונלי)
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <ImageUpload
                      value={field.value || undefined}
                      label="העלאת תמונת כיסוי"
                      onChange={(file) => {
                        setCoverFile(file);
                        if (file !== null) {
                          field.onChange("");
                        }
                      }}
                      onClear={() => {
                        setCoverFile(null);
                        field.onChange("");
                      }}
                    />
                    <Input
                      type="url"
                      placeholder="או הדביקו כתובת תמונה (https://...)"
                      className="border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400"
                      {...field}
                      disabled={coverFile !== null}
                      onChange={(e) => {
                        setCoverFile(null);
                        field.onChange(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              !(form.watch("category_id") ?? "").trim()
            }
            className="w-full sm:w-auto"
          >
            {form.formState.isSubmitting
              ? "שומר..."
              : isEditMode
                ? "עדכן סרטון"
                : "שמור סרטון"}
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex w-full justify-center border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 sm:w-auto",
            )}
          >
            חזרה לאתר
          </Link>
        </div>
      </form>
    </Form>
  );
}
