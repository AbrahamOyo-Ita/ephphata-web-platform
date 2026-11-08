import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s · Ephphata Ops" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // The login page renders standalone (no shell).
  if (!user) {
    return <>{children}</>;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
