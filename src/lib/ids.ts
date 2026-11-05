import { randomBytes, randomUUID, createHash } from "node:crypto";

/**
 * Identifier helpers.
 * - Public references are short, human-readable and speakable over the phone.
 * - QR tokens are opaque, high-entropy and carry NO personal data, so a leaked
 *   QR image cannot expose an attendee's identity.
 */

// Crockford-style alphabet: no I, L, O, U - avoids transcription errors.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function uuid(): string {
  return randomUUID();
}

export function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/** EPH-26-8H4K2Q  - year-scoped, unique, typeable. */
export function registrationReference(year = new Date().getFullYear()): string {
  return `EPH-${String(year).slice(2)}-${randomCode(6)}`;
}

/** VOL-26-4XQ7M2 */
export function volunteerReference(year = new Date().getFullYear()): string {
  return `VOL-${String(year).slice(2)}-${randomCode(6)}`;
}

/** PRY-26-K3N8P5 */
export function prayerReference(year = new Date().getFullYear()): string {
  return `PRY-${String(year).slice(2)}-${randomCode(6)}`;
}

/** 32 bytes of entropy, URL-safe. Never includes names, emails or IDs. */
export function qrToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** One-way IP pseudonym for audit + rate limiting (no raw IPs at rest). */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? (process.env.NODE_ENV === "production" ? null : "ephaphata-dev-salt");
  if (!salt) throw new Error("IP_HASH_SALT must be configured in production.");
  return sha256(`${salt}:${ip}`).slice(0, 32);
}
