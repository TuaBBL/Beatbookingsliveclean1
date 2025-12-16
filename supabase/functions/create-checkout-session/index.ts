import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please contact support." }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { event_id } = await req.json();

    if (!event_id) {
      return new Response(
        JSON.stringify({ error: "Missing event_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("id, creator_id, title, status")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event.creator_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to publish this event" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event.status === "published") {
      return new Response(
        JSON.stringify({ error: "Event is already published" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { count } = await supabaseClient
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .eq("status", "published");

    if (count !== null && count < 1) {
      return new Response(
        JSON.stringify({
          error: "You still have free publishes available. Use the free publish option.",
          free_publishes_remaining: 1 - count
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Event Publishing",
              description: `Publish event: ${event.title}`,
            },
            unit_amount: 3000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/events/${event_id}?published=true`,
      cancel_url: `${req.headers.get("origin")}/events/${event_id}?canceled=true`,
      metadata: {
        event_id: event_id,
        user_id: user.id,
        purpose: "event_publish",
      },
    });

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-checkout-session:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
