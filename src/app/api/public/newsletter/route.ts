import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailRule } from "@/lib/validation";
import { upsertNewsletterSubscriber } from "@/lib/data/audience";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: emailRule });

export async function POST(req: NextRequest) {
  pruneRateLimits();

  const limit = await rateLimit("newsletter", 5, 900);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${limit.retryAfter} seconds.` },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 422 }
    );
  }

  upsertNewsletterSubscriber(parsed.data.email);
  return NextResponse.json({ ok: true });
}
