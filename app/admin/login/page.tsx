import type { ReactElement } from "react";

import { LoginForm } from "@/components/admin/LoginForm";

/**
 * Public admin login route (not linked from site header).
 */
export default function AdminLoginPage(): ReactElement {
  return <LoginForm />;
}
