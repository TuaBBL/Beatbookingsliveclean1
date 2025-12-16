import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id) {
      return new Response("Missing event_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response("Missing Authorization", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response("Invalid auth", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: eventRow, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("id, creator_id, creator_role, status, title")
      .eq("id", event_id)
      .single();

    if (eventErr || !eventRow) {
      return new Response("Event not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (eventRow.creator_id !== userData.user.id) {
      return new Response("Not event creator", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const unitAmount = 50;
    const currency = "aud";

    const appUrl = Deno.env.get("APP_URL")!;
    const successUrl = `${appUrl}/publish/success?event_id=${event_id}&promo=true`;
    const cancelUrl = `${appUrl}/publish/cancel?event_id=${event_id}&promo=true`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Promo Test Payment" },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        event_id,
        creator_id: eventRow.creator_id,
        creator_role: eventRow.creator_role,
        promo_test: "true",
      },
    });

    await supabaseAdmin.from("event_payments").insert({
      event_id,
      creator_id: eventRow.creator_id,
      stripe_session_id: session.id,
      status: "pending",
      amount: "0.50",
      currency,
    });

    return new Response(JSON.stringify({ checkout_url: session.url }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-promo-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
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