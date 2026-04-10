import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const EnvSchema = z.object({
  url: z.string().url(),
  anonKey: z.string().min(1),
});

export type SupabaseEnv = z.infer<typeof EnvSchema>;

export function getSupabaseEnv(): SupabaseEnv {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return EnvSchema.parse({ url, anonKey });
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const env = getSupabaseEnv();
  client = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

