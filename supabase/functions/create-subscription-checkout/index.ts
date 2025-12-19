import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (!userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid auth" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { plan } = await req.json();
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Missing plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: artist } = await supabaseAdmin
      .from("artist_profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .single();

    if (!artist) {
      return new Response(
        JSON.stringify({ error: "Artist profile not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const prices: Record<string, string | undefined> = {
      test: Deno.env.get("STRIPE_PRICE_TEST"),
      standard: Deno.env.get("STRIPE_PRICE_STANDARD"),
      premium: Deno.env.get("STRIPE_PRICE_PREMIUM"),
    };

    const priceId = prices[plan];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbTier = plan === "test" ? "standard" : plan;

    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          artist_id: artist.id,
          plan,
          subscription_tier: dbTier,
          entitlement_tier: dbTier,
          status: "pending",
          is_active: false,
        },
        { onConflict: "artist_id" }
      );

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
