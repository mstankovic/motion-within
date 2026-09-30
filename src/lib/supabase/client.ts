"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | undefined;

const LOOPBACK = new Set(["127.0.0.1", "localhost"]);

/**
 * Local dev on a phone (http://192.168.x.x:3000): the configured URL points at 127.0.0.1, which on
 * the phone is the phone itself. Talk to the same machine that serves the page instead.
 */
function browserUrl(configured: string) {
  const url = new URL(configured);
  const pageHost = window.location.hostname;
  if (LOOPBACK.has(url.hostname) && !LOOPBACK.has(pageHost)) url.hostname = pageHost;
  return url.toString().replace(/\/$/, "");
}

export function createClient() {
  if (!browserClient) {
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    browserClient = createBrowserClient<Database>(
      browserUrl(configured),
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        // Keep the session cookie name the server uses (derived from the configured URL).
        cookieOptions: { name: `sb-${new URL(configured).hostname.split(".")[0]}-auth-token` },
      },
    );
  }
  return browserClient;
}
