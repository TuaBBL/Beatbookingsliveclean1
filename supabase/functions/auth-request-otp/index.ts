import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Generate a 6-digit numeric OTP
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using Web Crypto (Edge compatible)
 */
async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Supabase service-role client (admin)
 */
function supabaseServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role environment variables");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * JSON response helper
 */
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { email } = await req.json().catch(() => ({}));

    if (!email || typeof email !== "string") {
      return json({ error: "Invalid email" }, 400);
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const supabase = supabaseServiceClient();

    // Store OTP (overwrite if exists)
    await supabase.from("email_otps").upsert({
      email,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
    });

    // Build sender safely (NO undefined possible)
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ??
      "BeatBookingsLive <info@beatbookingslive.com>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Your BeatBookingsLive verification code",
        html: `
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:3px">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend error:", await resendResponse.text());
      return json({ error: "Failed to send verification email" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("auth-request-otp error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});