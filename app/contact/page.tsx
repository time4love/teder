import type { Metadata } from "next";

import { FrequencyTuner } from "@/components/contact/FrequencyTuner";

export const metadata: Metadata = {
  title: "יצירת קשר",
  description: "כוונו לתדר: פנו אלינו ישירות באימייל, בוואטסאפ או בטלגרם.",
};

export default function ContactPage(): JSX.Element {
  return (
    <main dir="rtl">
      <FrequencyTuner />
    </main>
  );
}
