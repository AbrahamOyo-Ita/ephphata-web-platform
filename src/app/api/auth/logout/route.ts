import { NextResponse } from "next/server";
import { destroySession, getSessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  await destroySession();
  if (user) {
    await writeAudit({ actor: user, action: "auth.logout", entityType: "profile", entityId: user.id });
  }
  return NextResponse.json({ ok: true });
}
