import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function supabaseServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role environment variables");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
