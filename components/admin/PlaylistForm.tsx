"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createPlaylistAction, updatePlaylistAction } from "@/app/admin/actions";
import { ImageUpload } from "@/components/admin/ImageUpload";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  adminPlaylistFormSchema,
  type AdminPlaylistFormValues,
} from "@/lib/validations/admin-playlist";
import type { Playlist } from "@/types/database";

export interface PlaylistFormProps {
  /** When set, updates this playlist; otherwise creates a new one. */
  initialData?: Playlist;
}

export function PlaylistForm({ initialData }: PlaylistFormProps): ReactElement {
  const router = useRouter();
  const isEdit = initialData !== undefined;
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const defaultValues = useMemo<AdminPlaylistFormValues>(
    () => ({
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      cover_image_url: initialData?.cover_image_url ?? "",
      sort_order: initialData?.sort_order ?? 0,
    }),
    [initialData],
  );

  const form = useForm<AdminPlaylistFormValues>({
    resolver: zodResolver(adminPlaylistFormSchema),
    defaultValues,
  });

  async function onSubmit(values: AdminPlaylistFormValues): Promise<void> {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("description", values.description ?? "");
    if (coverFile !== null) {
      fd.append("cover_image_file", coverFile);
    }
    fd.append("cover_image_url", values.cover_image_url ?? "");
    fd.append("sort_order", String(values.sort_order));

    if (isEdit && initialData !== undefined) {
      const result = await updatePlaylistAction(initialData.id, fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("הפלייליסט עודכן");
      router.refresh();
      return;
    }

    const result = await createPlaylistAction(fd);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("הפלייליסט נוצר");
    router.push(`/admin/playlists/${result.id}/edit`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        dir="rtl"
      >
        <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">כותרת</FormLabel>
                <FormControl>
                  <Input
                    placeholder="שם הפלייליסט / הנושא"
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
                <FormLabel className="text-zinc-900">תיאור</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="תקציר קצר שיוצג בכרטיס המגזין..."
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
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">תמונת כיסוי</FormLabel>
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
                <FormDescription className="text-zinc-500">
                  העלאת קובץ מעדיפה על פני כתובת. יחס מומלץ: 4:5 (פורטרט).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900">סדר הופעה</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="border-zinc-200 bg-white text-zinc-900"
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    value={Number.isFinite(field.value) ? field.value : 0}
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(
                        raw === "" ? 0 : Number.parseInt(raw, 10),
                      );
                    }}
                  />
                </FormControl>
                <FormDescription className="text-zinc-500">
                  מספר נמוך יותר מופיע קודם ברשימת הפלייליסטים.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full sm:w-auto"
          >
            {form.formState.isSubmitting
              ? "שומר..."
              : isEdit
                ? "עדכן פלייליסט"
                : "צור פלייליסט"}
          </Button>
          <Link
            href="/admin/playlists"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex w-full justify-center border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 sm:w-auto",
            )}
          >
            חזרה לרשימת הפלייליסטים
          </Link>
        </div>
      </form>
    </Form>
  );
}
