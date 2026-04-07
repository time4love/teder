"use client";

import type { ReactElement } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ShareButtonAppearance = "default" | "onDark";

export interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
  /** High-contrast outline for use on cinematic / dark hero backgrounds. */
  appearance?: ShareButtonAppearance;
}

export function ShareButton({
  title,
  text,
  url,
  className,
  appearance = "default",
}: ShareButtonProps): ReactElement {
  const handleShare = async (): Promise<void> => {
    const shareUrl =
      url ??
      (typeof window !== "undefined" ? window.location.href : "");
    if (shareUrl === "") return;

    if (typeof navigator !== "undefined" && navigator.share !== undefined) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // User canceled or share failed — ignore
      }
    } else if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText !== undefined
    ) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("הקישור הועתק ללוח!");
      } catch {
        toast.error("לא ניתן להעתיק את הקישור");
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "gap-2 rounded-full",
        appearance === "onDark" &&
          "border-white/25 bg-black/45 text-white shadow-none backdrop-blur-md hover:border-white/40 hover:bg-white/15 hover:text-white",
        className,
      )}
      onClick={() => void handleShare()}
    >
      <Share2 className="size-4" aria-hidden />
      שיתוף
    </Button>
  );
}
