/**
 * Environment introspection for the admin settings screen.
 * ------------------------------------------------------------------
 * Reports only whether a value exists - never the value itself, so this can be
 * rendered safely in the browser bundle-free server component.
 */
export type EnvSummary = {
  sessionSecret: boolean;
  ipHashSalt: boolean;
  email: boolean;
  whatsapp: boolean;
  databaseUrl: boolean;
  supabase: boolean;
  storage: boolean;
  demoMode: boolean;
};

function has(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

export function envSummary(): EnvSummary {
  return {
    sessionSecret: has("SESSION_SECRET"),
    ipHashSalt: has("IP_HASH_SALT"),
    email: has("RESEND_API_KEY", "EMAIL_FROM"),
    whatsapp: has("WHATSAPP_TOKEN", "WHATSAPP_SENDER"),
    databaseUrl: has("DATABASE_URL"),
    supabase: has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    storage: has("SUPABASE_SERVICE_ROLE_KEY"),
    demoMode: process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true",
  };
}
