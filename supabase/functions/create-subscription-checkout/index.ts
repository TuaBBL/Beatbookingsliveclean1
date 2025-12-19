import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // ---------- CORS ----------
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // ---------- AUTH ----------
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response("Missing Authorization", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: userData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response("Invalid auth", {
        status: 401,
        headers: corsHeaders,
      });
    }

   // ---------- INPUT ----------
const { plan } = await req.json();

if (!plan) {
  return new Response("Missing plan", {
    status: 400,
    headers: corsHeaders,
  });
}

// ---------- FIND ARTIST ----------
const { data: artistProfile } = await supabaseAdmin
  .from("artist_profiles")
  .select("id")
  .eq("user_id", userData.user.id)
  .single();

if (!artistProfile) {
  return new Response("Artist profile not found", {
    status: 400,
    headers: corsHeaders,
  });
}

// ---------- UPSERT SUBSCRIPTION ----------
const { data: subscription } = await supabaseAdmin
  .from("subscriptions")
  .upsert(
    {
      artist_id: artistProfile.id,
      plan,
      status: "pending",
      subscription_tier: plan,
      entitlement_tier: plan,
      is_active: false,
    },
    { onConflict: "artist_id" }
  )
  .select()
  .single();

// ---------- STRIPE CHECKOUT ----------
const siteUrl = Deno.env.get("SITE_URL")!;
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  payment_method_types: ["card"],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${siteUrl}/artist/dashboard?sub=success`,
  cancel_url: `${siteUrl}/subscribe?sub=cancel`,
  metadata: {
    subscription_id: subscription.id,
    artist_id: artistProfile.id,
  },
});

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Subscription checkout error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
