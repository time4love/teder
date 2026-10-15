import type { Metadata } from "next";

import { ComingSoon } from "@/components/home/ComingSoon";
import { FREEDOM_PROTOCOL_TITLE } from "@/lib/gates";

export const metadata: Metadata = {
  title: FREEDOM_PROTOCOL_TITLE,
};

export default function FreedomProtocolPage(): JSX.Element {
  return (
    <ComingSoon
      title={FREEDOM_PROTOCOL_TITLE}
      tagline="הדרך החוצה, צעד אחר צעד"
      rgb={[214, 196, 140]}
    />
  );
}
