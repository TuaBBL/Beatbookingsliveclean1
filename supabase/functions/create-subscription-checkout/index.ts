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
  // CORS preflight
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
    // -------- AUTH --------
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

    // -------- INPUT --------
    const { subscriptionId, plan } = await req.json();

    if (!subscriptionId || !plan) {
      return new Response("Missing subscriptionId or plan", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // -------- FETCH SUBSCRIPTION --------
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, artist_id, status")
      .eq("id", subscriptionId)
