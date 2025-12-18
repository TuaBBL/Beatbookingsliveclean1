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
    const { subscriptionId, plan } = await req.json();

    if (!subscriptionId || !plan) {
      return new Response("Missing subscriptionId or plan", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ---------- FETCH SUBSCRIPTION ----------
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, artist_id, status")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return new Response("Subscription not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // ---------- OWNERSHIP CHECK ----------
    const { data: artistProfile } = await supabaseAdmin
      .from("artist_profiles")
      .select("user_id")
      .eq("id", subscription.artist_id)
      .single();

    if (!artistProfile || artistProfile.user_id !== userData.user.id) {
      return new Response("Not authorised", {
        status: 403,
        headers: corsHeaders,
      });
    }

    // ---------- STRIPE PRICE MAP ----------
    const priceMap: Record<string, string | undefined> = {
      standard: Deno.env.get("STRIPE_PRICE_STANDARD"),
      premium: Deno.env.get("STRIPE_PRICE_PREMIUM"),
      test: Deno.env.get("STRIPE_PRICE_TEST"),
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      return new Response("Invalid plan", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ---------- CREATE CHECKOUT ----------
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) {
      throw new Error("SITE_URL env var not set");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/subscribe/success`,
      cancel_url: `${siteUrl}/subscribe/cancel`,
      metadata: {
        subscription_id: subscription.id,
        plan,
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
