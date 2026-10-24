import { createClient } from "@supabase/supabase-js";
import { env } from "@app/env";
// This single client also exposes Storage. No bucket or upload permission is needed yet.
export const supabase =
  env.supabaseUrl && env.supabaseAnonKey
    ? createClient(env.supabaseUrl, env.supabaseAnonKey)
    : null;
