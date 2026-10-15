import type { Metadata } from "next";

import { DoveScene } from "@/components/about/DoveScene";

export const metadata: Metadata = {
  title: "אודות",
  description: "להתחבר לתדר אמת. ארכיון חשיפות, עדויות ומידע.",
};

export default function AboutPage(): JSX.Element {
  return (
    <main dir="rtl">
      <DoveScene />
    </main>
  );
}
