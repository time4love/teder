"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteVideoAction } from "@/app/admin/actions";
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

export interface DeleteVideoButtonProps {
  videoId: string;
}

export function DeleteVideoButton({ videoId }: DeleteVideoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm(): void {
    startTransition(() => {
      void (async () => {
        const result = await deleteVideoAction(videoId);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("הסרטון נמחק");
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
          <AlertDialogTitle>מחיקת סרטון</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-600">
            האם אתה בטוח שברצונך למחוק את הסרטון?
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
