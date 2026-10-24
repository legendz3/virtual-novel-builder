interface AppEnvironment {
  appEnv: "development" | "test" | "production";
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  debug: boolean;
}
// Cloud configuration is optional, including in guest-only production deployments.
export function parseEnvironment(
  raw: Record<string, unknown>,
  production: boolean,
): AppEnvironment {
  const appEnv = raw.VITE_APP_ENV || (production ? "production" : "development");
  if (appEnv !== "development" && appEnv !== "test" && appEnv !== "production")
    throw new Error("Invalid VITE_APP_ENV");
  const url = typeof raw.VITE_SUPABASE_URL === "string" ? raw.VITE_SUPABASE_URL.trim() : "";
  const key =
    typeof raw.VITE_SUPABASE_ANON_KEY === "string" ? raw.VITE_SUPABASE_ANON_KEY.trim() : "";
  if (Boolean(url) !== Boolean(key))
    throw new Error("Supply both Supabase URL and public anon key, or leave both blank.");
  if (url) {
    const parsed = new URL(url);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      (production && parsed.protocol !== "https:")
    )
      throw new Error("Supabase requires a valid HTTP URL (HTTPS in production).");
    if (key.startsWith("sb_secret_"))
      throw new Error("Never use a Supabase secret key in a browser.");
  }
  return {
    appEnv,
    supabaseUrl: url || undefined,
    supabaseAnonKey: key || undefined,
    debug: !production && appEnv === "development",
  };
}
export const env = parseEnvironment(import.meta.env, import.meta.env.PROD);
