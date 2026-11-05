import { NextResponse, type NextRequest } from "next/server";
import { attemptLogin } from "@/lib/auth";
import { loginSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin sign-in.
 * Tight rate limit (5 attempts / 10 min per IP) on top of bcrypt cost 12, and
 * a uniform error message so the endpoint cannot be used to enumerate accounts.
 */
export async function POST(req: NextRequest) {
  pruneRateLimits();

  const limit = await rateLimit("login", 5, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many sign-in attempts. Please wait ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Enter your email address and password.",
        fieldErrors: fieldErrors(parsed.error),
      },
      { status: 422 }
    );
  }

  const result = await attemptLogin(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
