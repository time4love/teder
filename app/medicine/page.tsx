import type { Metadata } from "next";

import { GateScene } from "@/components/gates/GateScene";
import type { GateTopic } from "@/components/gates/GateScene";
import { GATES } from "@/lib/gates";

const gate = GATES[2];

/** What the רפואת אמת gate will hold, as listed by the site's author. */
const TOPICS: readonly GateTopic[] = [
  { title: "רפואת הכתר👑" },
  {
    title: "רפואת אמת מתוקשרת:",
    items: [
      'פרוטוקול ההחלמה המקיף מ"חיסוני הקורונה"',
      'פרוטוקול החלמה מפגיעות קרינה ו"ריסוסים"',
    ],
  },
];

export const metadata: Metadata = {
  title: gate.title,
  description: gate.tagline,
};

export default function MedicinePage(): JSX.Element {
  return (
    <main dir="rtl">
      <GateScene gate={gate} topics={TOPICS} />
    </main>
  );
}
