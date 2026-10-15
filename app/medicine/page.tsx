import type { Metadata } from "next";

import { ComingSoon } from "@/components/home/ComingSoon";
import { GATES } from "@/lib/gates";

const gate = GATES[2];

export const metadata: Metadata = {
  title: gate.title,
};

export default function MedicinePage(): JSX.Element {
  return <ComingSoon title={gate.title} tagline={gate.tagline} rgb={gate.rgb} />;
}
