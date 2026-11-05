import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { campaignSchema } from "@/lib/validation";
import { createCampaign } from "@/lib/data/admin-campaigns";
import { emailConfigured, whatsappConfigured } from "@/lib/notifications";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Campaign creation.
 * A campaign is only queued - never marked "sent" - because the provider, not
 * this app, determines delivery. If the channel has no credentials the request
 * is refused outright rather than silently swallowed.
 */
export async function POST(req: NextRequest) {
  const user = await requireApiUser("communications.manage");
  if (user instanceof NextResponse) return user;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." },
      { status: 422 }
    );
  }

  const { channel } = parsed.data;
  const ready = channel === "email" ? emailConfigured() : whatsappConfigured();
  if (!ready) {
    return NextResponse.json(
      {
        ok: false,
        error: `${channel === "email" ? "Email" : "WhatsApp"} is not configured in this environment. Add provider credentials before sending.`,
        code: "provider_not_configured",
      },
      { status: 503 }
    );
  }

  const result = createCampaign(parsed.data, user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
  }

  await writeAudit({
    actor: user,
    action: "campaign.create",
    entityType: "campaign",
    entityId: result.id,
    detail: { channel, audience: parsed.data.audience, queued: result.queued },
  });

  return NextResponse.json({ ok: true, id: result.id, queued: result.queued });
}
