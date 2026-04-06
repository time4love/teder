"use client";

import dynamic from "next/dynamic";

/**
 * Loads Sonner only on the client to avoid broken server vendor chunks for `sonner`.
 */
export const ToasterLoader = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);
