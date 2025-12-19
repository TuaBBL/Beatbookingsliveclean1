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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // ---------- AUTH ----------
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return new Response("Missing Authorization", { status: 401, headers: corsHeaders });

    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) return new Response("Invalid auth", { status: 401, headers: corsHeaders });

    // ---------- INPUT ----------
    const { plan } = await req.json();
    if (!plan) return new Response("Missing plan", { status: 400, headers: corsHeaders });

    // ---------- ARTIST ----------
    const { data: artist } = await supabaseAdmin
      .from("artist_profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!artist) {
      return new Response("Artist profile not found", { status: 400, headers: corsHeaders });
    }

    // ---------- FREE FOREVER ----------
    if (plan === "free_forever") {
      const { count } = await supabaseAdmin
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("plan", "free_forever");

      if ((count ?? 0) >= 50) {
        return new Response(
          JSON.stringify({ error: "Free Forever spots exhausted" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            artist_id: artist.id,
            plan: "free_forever",
            subscription_tier: "free_forever",
            entitlement_tier: "premium",
            status: "active",
            is_active: true,
            started_at: new Date().toISOString(),
            ends_at: null,
          },
          { onConflict: "artist_id" }
        );

      return new Response(
        JSON.stringify({ redirect: "/artist/dashboard?sub=success" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------- PRICE MAP ----------
    const prices: Record<string, string | undefined> = {
      test: Deno.env.get("STRIPE_TEST_PRICE_ID"),
      standard: Deno.env.get("STRIPE_STANDARD_PRICE_ID"),
      premium: Deno.env.get("STRIPE_PREMIUM_PRICE_ID"),
    };

    const priceId = prices[plan];
    if (!priceId) {
      return new Response("Invalid plan selected", { status: 400, headers: corsHeaders });
    }

    // ---------- PLACEHOLDER SUB ----------
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          artist_id: artist.id,
          plan,
          status: "pending",
          is_active: false,
        },
        { onConflict: "artist_id" }
      )
      .select()
      .single();

    // ---------- STRIPE ----------
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/artist/dashboard?sub=success`,
      cancel_url: `${siteUrl}/subscribe?sub=cancel`,
      metadata: {
        artist_id: artist.id,
        plan,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Subscription checkout error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
