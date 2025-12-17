import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * JSON response helper
 */
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
  });
}

/**
 * Supabase service-role client (admin)
 */
function supabaseServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role env vars");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Supabase anon client (session minting)
 */
function supabaseAnonClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon env vars");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Hash OTP (Edge compatible)
 */
async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { email, otp } = await req.json().catch(() => ({}));

    if (!email || !otp) {
      return json({ error: "Invalid payload" }, 400);
    }

    const normalisedEmail = String(email).trim().toLowerCase();

    const supabase = supabaseServiceClient();
    const anon = supabaseAnonClient();

    /**
     * 1️⃣ Verify OTP
     */
    const otpHash = await hashOtp(String(otp));

    const { data: record } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", normalisedEmail)
      .eq("otp_hash", otpHash)
      .single();

    if (!record) {
      return json({ error: "Invalid or expired code" }, 401);
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return json({ error: "Code expired" }, 401);
    }

    if (record.attempts >= 5) {
      return json({ error: "Too many attempts" }, 429);
    }

    /**
     * 2️⃣ Increment attempts (replay protection)
     */
    await supabase
      .from("email_otps")
      .update({ attempts: record.attempts + 1 })
      .eq("email", normalisedEmail);

    /**
     * 3️⃣ Get or create auth user
     */
    const { data: users } = await supabase.auth.admin.listUsers({
      email: normalisedEmail,
      perPage: 1,
    });

    let user = users?.users?.[0];

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalisedEmail,
        email_confirm: true,
      });

      if (error || !data?.user) {
        throw new Error("User creation failed");
      }

      user = data.user;
    }

    /**
     * 4️⃣ GUARANTEE PROFILE EXISTS (THIS FIXES LOGIN)
     */
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: user.email.split("@")[0], // temporary fallback
          role: "planner",                // safe default
          agreed_terms: false,
        },
        { onConflict: "id" }
      );

    /**
     * 5️⃣ Generate login token (NO email sent)
     */
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalisedEmail,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error("Failed to generate login token");
    }

    /**
     * 6️⃣ Verify token_hash → mint REAL Supabase session
     */
    const { data: verified, error: verifyError } =
      await anon.auth.verifyOtp({
        type: "email",
        token_hash: linkData.properties.hashed_token,
      });

    if (verifyError || !verified?.session) {
      throw new Error("Session minting failed");
    }

    /**
     * 7️⃣ Cleanup OTP (single-use)
     */
    await supabase
      .from("email_otps")
      .delete()
      .eq("email", normalisedEmail);

    /**
     * 8️⃣ Return frontend-safe payload
     */
    const session = verified.session;

    return json({
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
      },
    });
  } catch (err) {
    console.error("auth-verify-otp error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
