"use client";

import type { ReactElement } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  className,
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
      className={cn("gap-2 rounded-full", className)}
      onClick={() => void handleShare()}
    >
      <Share2 className="size-4" aria-hidden />
      שיתוף
    </Button>
  );
}
