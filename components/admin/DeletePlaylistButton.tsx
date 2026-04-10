"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deletePlaylistAction } from "@/app/admin/actions";
import { isServerActionError } from "@/lib/server-action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DeletePlaylistButtonProps {
  playlistId: string;
}

export function DeletePlaylistButton({
  playlistId,
}: DeletePlaylistButtonProps): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm(): void {
    startTransition(() => {
      void (async () => {
        const result = await deletePlaylistAction(playlistId);
        if (isServerActionError(result)) {
          toast.error(result.error);
          return;
        }
        if (result == null) {
          toast.error("שגיאה לא צפויה");
          return;
        }
        toast.success("הפלייליסט נמחק");
        router.push("/admin/playlists");
        router.refresh();
      })();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        disabled={isPending}
        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
      >
        {isPending ? "מוחק..." : "מחק"}
      </AlertDialogTrigger>
      <AlertDialogContent className="border-zinc-200 bg-white text-zinc-900">
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת פלייליסט</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-600">
            מחיקת הפלייליסט תסיר את הקישור לסרטונים מתוך הגיליון. הסרטונים עצמם
            לא יימחקו ממסד הנתונים.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100">
            ביטול
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
