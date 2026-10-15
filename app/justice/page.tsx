import type { Metadata } from "next";

import { GateScene } from "@/components/gates/GateScene";
import { GATES } from "@/lib/gates";

const gate = GATES[0];

export const metadata: Metadata = {
  title: gate.title,
  description: gate.tagline,
};

export default function JusticePage(): JSX.Element {
  return (
    <main dir="rtl">
      <GateScene gate={gate} />
    </main>
  );
}
