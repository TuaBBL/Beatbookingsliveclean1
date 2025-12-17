import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function hashOtp(otp: string) {
  const data = new TextEncoder().encode(otp);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  // ✅ REQUIRED for browser calls
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return json({ error: "Invalid payload" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } }
    );

    const otpHash = await hashOtp(String(otp));

    // 1️⃣ Verify OTP
    const { data: record } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_hash", otpHash)
      .single();

    if (!record) {
      return json({ error: "Invalid or expired code" }, 401);
    }

    // 2️⃣ Create or fetch user
    const { data: users } = await supabase.auth.admin.listUsers({
      email,
      perPage: 1,
    });

    let user = users?.users?.[0];

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (error || !data?.user) {
        return json({ error: "User creation failed" }, 500);
      }

      user = data.user;
    }

    // 3️⃣ Mint session (NO email sent)
    const { data: link } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    const { data: verified, error } =
      await anon.auth.verifyOtp({
        type: "email",
        token_hash: link.properties.hashed_token,
      });

    if (error || !verified?.session) {
      return json({ error: "Session minting failed" }, 500);
    }

    // 4️⃣ Cleanup OTP
    await supabase.from("email_otps").delete().eq("email", email);

    return json({
      session: verified.session,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("auth-verify-otp error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
