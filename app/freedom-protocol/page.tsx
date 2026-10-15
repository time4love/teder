import { permanentRedirect } from "next/navigation";

import { FREEDOM_PROTOCOL_HREF } from "@/lib/gates";

/** The protocol lives on its video page; keep this address working for old links. */
export default function FreedomProtocolPage(): never {
  permanentRedirect(FREEDOM_PROTOCOL_HREF);
}
