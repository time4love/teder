"use client";

import { Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  /** Existing remote URL to preview (e.g. from DB). */
  value?: string;
  onChange: (file: File | null) => void;
  onClear: () => void;
  className?: string;
  /** Accessible label for the file control. */
  label?: string;
}

/**
 * Dropzone-style image picker with local preview and clear.
 * Local file preview takes precedence over `value` until cleared.
 */
export function ImageUpload({
  value,
  onChange,
  onClear,
  className,
  label = "בחירת תמונה",
}: ImageUploadProps): ReactElement {
  const inputId = useId();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const remoteSrc =
    value !== undefined && value !== null && value.trim() !== ""
      ? value.trim()
      : null;
  const displaySrc = objectUrl ?? remoteSrc;
  const showPreview = displaySrc !== null && displaySrc !== "";

  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setObjectUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current !== null) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file === undefined) {
      return;
    }
    revokeCurrentObjectUrl();
    const next = URL.createObjectURL(file);
    objectUrlRef.current = next;
    setObjectUrl(next);
    onChange(file);
  }

  function handleClear(): void {
    revokeCurrentObjectUrl();
    onClear();
    onChange(null);
  }

  return (
    <div dir="rtl" className={cn("w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/80 transition-colors",
          "hover:border-zinc-400 hover:bg-zinc-50",
        )}
      >
        {showPreview ? (
          <div className="relative aspect-[4/5] max-h-72 w-full sm:max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview may be blob or remote URL */}
            <img
              src={displaySrc}
              alt=""
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute end-2 top-2 inline-flex size-9 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-sm transition hover:bg-white hover:text-zinc-900"
              aria-label="הסרת תמונה"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex min-h-[10rem] cursor-pointer flex-col items-center justify-center gap-3 px-6 py-10 text-center"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-zinc-200/80 text-zinc-700">
              <Upload className="size-6" aria-hidden />
            </span>
            <span className="text-sm font-medium text-zinc-800">{label}</span>
            <span className="text-xs text-zinc-500">
              PNG, JPG, WebP — גררו לכאן או לחצו לבחירה
            </span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}
